import { logSecurityEvent as logEvent } from './securityLogger';

export interface SecurityEvent {
  event_type: 'auth_failure' | 'data_access_violation' | 'rate_limit_exceeded' | 'input_validation_error' | 'suspicious_activity';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AppError extends Error {
  /**
   * @param message      Internal, developer-facing error message.
   * @param userMessage  Safe message displayed to users / UI.
   * @param statusCode   HTTP-style status code (default 500).
   * @param severity     Security severity level for logging.
   * @param logDetails   Additional details for security logging.
   */
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly statusCode: number = 500,
    public readonly severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public readonly logDetails: Record<string, any> = {}
  ) {
    super(message);
    // Restore prototype chain (required when targeting ES5)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SecurityError extends AppError {
  constructor(
    message: string,
    userMessage: string = 'Security violation detected',
    logDetails: Record<string, any> = {}
  ) {
    super(message, userMessage, 403, 'high', logDetails);
  }
}

class ErrorHandler {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log security events to Firestore via securityLogger
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Adapt the event to match securityLogger's expected format if needed
      // Currently they seem compatible enough, but let's be explicit
      await logEvent({
        type: event.event_type,
        userId: event.user_id || 'unknown',
        userAgent: event.user_agent || navigator.userAgent,
        details: {
          ...event.details,
          severity: event.severity,
          ip_address: event.ip_address
        }
      });

    } catch (err) {
      // Fail silently in production to avoid exposing system internals
      if (this.isDevelopment) {
        console.error('Security logging error:', err);
      }
    }
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  sanitizeInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new SecurityError(
        'Invalid input type',
        'Invalid input provided',
        { inputType: typeof input }
      );
    }

    // Remove potentially dangerous characters and patterns
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:\s*text\/html/gi, '') // Remove data URLs
      .trim();

    // Limit length to prevent buffer overflow attacks
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate email format with security considerations
   */
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
  }

  /**
   * Rate limiting check (client-side implementation)
   */
  checkRateLimit(action: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    try {
      const key = `rate_limit_${action}`;
      const now = Date.now();
      const stored = localStorage.getItem(key);
      const attempts = stored ? JSON.parse(stored) : [];

      // Remove old attempts outside the window
      const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs);

      if (validAttempts.length >= maxAttempts) {
        this.logSecurityEvent({
          event_type: 'rate_limit_exceeded',
          details: { action, attempts: validAttempts.length },
          severity: 'medium'
        });
        return false;
      }

      // Add current attempt
      validAttempts.push(now);
      localStorage.setItem(key, JSON.stringify(validAttempts));
      return true;
    } catch (err) {
      // If localStorage fails, allow the action but log the issue
      if (this.isDevelopment) {
        console.warn('Rate limiting storage failed:', err);
      }
      return true;
    }
  }

  /**
   * Detect suspicious input patterns
   */
  detectSuspiciousActivity(input: string, context: string): void {
    const suspiciousPatterns = [
      { pattern: /(<script|javascript:|data:)/i, name: 'XSS_ATTEMPT' },
      { pattern: /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i, name: 'SQL_INJECTION' },
      { pattern: /(\.\.\/){3,}/, name: 'PATH_TRAVERSAL' },
      { pattern: /(exec|eval|system|cmd|powershell)/i, name: 'CODE_INJECTION' },
      { pattern: /(%3C|%3E|%27|%22)/i, name: 'URL_ENCODED_ATTACK' }
    ];

    for (const { pattern, name } of suspiciousPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent({
          event_type: 'suspicious_activity',
          details: {
            input: input.substring(0, 100), // Log first 100 chars only
            context,
            attack_type: name
          },
          severity: 'high'
        });

        throw new SecurityError(
          `Suspicious input detected: ${name}`,
          'Invalid input detected. Please check your data and try again.',
          { context, attack_type: name }
        );
      }
    }
  }
}

const errorHandlerInstance = new ErrorHandler();

/**
 * Enhanced centralised error handler with security logging
 */
export const handleError = async (error: unknown, context?: string): Promise<{ message: string; code: number }> => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log detailed error in development
  if (isDevelopment) {
    console.error('Application error:', error, 'Context:', context);
  }

  if (error instanceof AppError) {
    // Log security-related errors
    if (error instanceof SecurityError || error.severity === 'high' || error.severity === 'critical') {
      await errorHandlerInstance.logSecurityEvent({
        event_type: error instanceof SecurityError ? 'suspicious_activity' : 'input_validation_error',
        details: {
          message: error.message,
          context,
          ...error.logDetails
        },
        severity: error.severity
      });
    }

    return { message: error.userMessage, code: error.statusCode };
  }

  // Log unexpected errors as potential security issues
  await errorHandlerInstance.logSecurityEvent({
    event_type: 'suspicious_activity',
    details: {
      message: error instanceof Error ? error.message : 'Unknown error',
      context,
      error_type: 'UNEXPECTED_ERROR'
    },
    severity: 'medium'
  });

  return { message: 'Something went wrong. Please try again.', code: 500 };
};

// Export utility functions
export const sanitizeInput = (input: string, maxLength?: number) => errorHandlerInstance.sanitizeInput(input, maxLength);
export const validateEmail = (email: string) => errorHandlerInstance.validateEmail(email);
export const checkRateLimit = (action: string, maxAttempts?: number, windowMs?: number) => errorHandlerInstance.checkRateLimit(action, maxAttempts, windowMs);
export const detectSuspiciousActivity = (input: string, context: string) => errorHandlerInstance.detectSuspiciousActivity(input, context);
export const logSecurityEvent = (event: SecurityEvent) => errorHandlerInstance.logSecurityEvent(event);