/**
 * CSRF Protection Utilities
 * Client-side CSRF token management for form submissions
 */

import { SecurityError, logSecurityEvent } from './errorHandler';

class CSRFProtection {
  private static instance: CSRFProtection;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly TOKEN_LIFETIME = 60 * 60 * 1000; // 1 hour

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate a new CSRF token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or create a CSRF token
   */
  getToken(): string {
    const now = Date.now();
    
    // Generate new token if none exists or current token has expired
    if (!this.token || now > this.tokenExpiry) {
      this.token = this.generateToken();
      this.tokenExpiry = now + this.TOKEN_LIFETIME;
      
      // Store in sessionStorage for persistence across page refreshes
      try {
        sessionStorage.setItem('csrf_token', this.token);
        sessionStorage.setItem('csrf_token_expiry', this.tokenExpiry.toString());
      } catch (err) {
        // Continue without storage if unavailable
      }
    }
    
    return this.token;
  }

  /**
   * Validate a CSRF token
   */
  validateToken(providedToken: string): boolean {
    const currentToken = this.getToken();
    
    if (!providedToken || !currentToken) {
      logSecurityEvent({
        event_type: 'suspicious_activity',
        details: {
          attack_type: 'CSRF_TOKEN_MISSING',
          provided_token: !!providedToken,
          current_token: !!currentToken
        },
        severity: 'high'
      });
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (providedToken.length !== currentToken.length) {
      logSecurityEvent({
        event_type: 'suspicious_activity',
        details: {
          attack_type: 'CSRF_TOKEN_LENGTH_MISMATCH',
          provided_length: providedToken.length,
          expected_length: currentToken.length
        },
        severity: 'high'
      });
      return false;
    }

    let result = 0;
    for (let i = 0; i < currentToken.length; i++) {
      result |= providedToken.charCodeAt(i) ^ currentToken.charCodeAt(i);
    }

    const isValid = result === 0;
    
    if (!isValid) {
      logSecurityEvent({
        event_type: 'suspicious_activity',
        details: {
          attack_type: 'CSRF_TOKEN_INVALID',
          token_provided: true
        },
        severity: 'high'
      });
    }

    return isValid;
  }

  /**
   * Initialize CSRF protection (restore token from storage if available)
   */
  initialize(): void {
    try {
      const storedToken = sessionStorage.getItem('csrf_token');
      const storedExpiry = sessionStorage.getItem('csrf_token_expiry');
      
      if (storedToken && storedExpiry) {
        const expiry = parseInt(storedExpiry, 10);
        if (Date.now() < expiry) {
          this.token = storedToken;
          this.tokenExpiry = expiry;
        }
      }
    } catch (err) {
      // Continue without stored token if unavailable
    }
  }

  /**
   * Clear the current token (useful for logout)
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
    
    try {
      sessionStorage.removeItem('csrf_token');
      sessionStorage.removeItem('csrf_token_expiry');
    } catch (err) {
      // Continue even if storage clear fails
    }
  }

  /**
   * Add CSRF token to form data
   */
  addTokenToFormData(formData: FormData): FormData {
    const token = this.getToken();
    formData.append('csrf_token', token);
    return formData;
  }

  /**
   * Add CSRF token to request headers
   */
  addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    return {
      ...headers,
      'X-CSRF-Token': token
    };
  }

  /**
   * Validate CSRF token from request
   */
  validateRequest(request: {
    headers?: Record<string, string>;
    body?: FormData | Record<string, any>;
  }): void {
    let tokenFromRequest: string | null = null;

    // Try to get token from headers first
    if (request.headers && request.headers['X-CSRF-Token']) {
      tokenFromRequest = request.headers['X-CSRF-Token'];
    }
    // Then try to get from form data
    else if (request.body) {
      if (request.body instanceof FormData) {
        tokenFromRequest = request.body.get('csrf_token') as string;
      } else if (typeof request.body === 'object' && 'csrf_token' in request.body) {
        tokenFromRequest = request.body.csrf_token;
      }
    }

    if (!tokenFromRequest || !this.validateToken(tokenFromRequest)) {
      throw new SecurityError(
        'CSRF token validation failed',
        'Security token validation failed. Please refresh the page and try again.',
        { attack_type: 'CSRF_VALIDATION_FAILED' }
      );
    }
  }
}

// Export singleton instance
export const csrfProtection = CSRFProtection.getInstance();

// Utility functions for easy use
export const getCSRFToken = () => csrfProtection.getToken();
export const validateCSRFToken = (token: string) => csrfProtection.validateToken(token);
export const addCSRFToFormData = (formData: FormData) => csrfProtection.addTokenToFormData(formData);
export const addCSRFToHeaders = (headers?: Record<string, string>) => csrfProtection.addTokenToHeaders(headers);
export const validateCSRFRequest = (request: any) => csrfProtection.validateRequest(request);
export const initializeCSRF = () => csrfProtection.initialize();
export const clearCSRFToken = () => csrfProtection.clearToken();

// Initialize CSRF protection when module loads
initializeCSRF();