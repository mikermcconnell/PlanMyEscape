/**
 * Security Configuration for Production Deployment
 * Centralized security settings and constants
 */

export interface SecurityConfig {
  // Rate limiting settings
  rateLimiting: {
    loginAttempts: {
      maxAttempts: number;
      windowMs: number;
      blockDurationMs: number;
    };
    apiRequests: {
      maxRequests: number;
      windowMs: number;
    };
    dataModification: {
      maxAttempts: number;
      windowMs: number;
    };
  };
  
  // Input validation limits
  inputLimits: {
    tripName: { min: number; max: number };
    location: { max: number };
    email: { min: number; max: number };
    notes: { max: number };
    mealName: { max: number };
    activityName: { max: number };
    fileName: { max: number };
    generalText: { max: number };
  };
  
  // Session and authentication
  session: {
    timeoutMs: number;
    refreshThresholdMs: number;
    maxConcurrentSessions: number;
  };
  
  // Security monitoring
  monitoring: {
    enableSecurityLogs: boolean;
    logRetentionDays: number;
    alertThresholds: {
      suspiciousActivity: number;
      authFailures: number;
      rateLimitExceeded: number;
    };
  };
  
  // Content Security Policy
  csp: {
    allowedDomains: string[];
    allowedImageDomains: string[];
    allowedConnections: string[];
  };
}

// Production security configuration
export const SECURITY_CONFIG: SecurityConfig = {
  rateLimiting: {
    loginAttempts: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000 // 30 minutes
    },
    apiRequests: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    dataModification: {
      maxAttempts: 20,
      windowMs: 5 * 60 * 1000 // 5 minutes
    }
  },
  
  inputLimits: {
    tripName: { min: 1, max: 100 },
    location: { max: 200 },
    email: { min: 5, max: 254 },
    notes: { max: 2000 },
    mealName: { max: 100 },
    activityName: { max: 200 },
    fileName: { max: 255 },
    generalText: { max: 1000 }
  },
  
  session: {
    timeoutMs: 8 * 60 * 60 * 1000, // 8 hours
    refreshThresholdMs: 30 * 60 * 1000, // 30 minutes before expiry
    maxConcurrentSessions: 3
  },
  
  monitoring: {
    enableSecurityLogs: true,
    logRetentionDays: 90,
    alertThresholds: {
      suspiciousActivity: 5, // Alert after 5 suspicious activities from same user
      authFailures: 10, // Alert after 10 auth failures from same IP
      rateLimitExceeded: 3 // Alert after 3 rate limit violations
    }
  },
  
  csp: {
    allowedDomains: [
      "'self'",
      "https://*.supabase.co",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    allowedImageDomains: [
      "'self'",
      "data:",
      "https://*.supabase.co",
      "https://images.unsplash.com"
    ],
    allowedConnections: [
      "'self'",
      "https://*.supabase.co",
      "https://api.openweathermap.org"
    ]
  }
};

// Security patterns for threat detection
export const SECURITY_PATTERNS = {
  xss: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:\s*text\/html/gi
  ],
  
  sqlInjection: [
    /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/gi,
    /(exec|execute)\s+/gi,
    /'\s*(or|and)\s+'?\d/gi,
    /;\s*(drop|delete|update|insert)/gi
  ],
  
  pathTraversal: [
    /(\.\.\/){2,}/g,
    /[\/\\]\.\.([\/\\]|$)/g,
    /%2e%2e/gi,
    /%252e%252e/gi
  ],
  
  codeInjection: [
    /(exec|eval|system|cmd|powershell)/gi,
    /\$\{.*\}/g, // Template injection
    /<%.*%>/g, // Server-side template injection
    /__import__/g // Python import injection
  ]
};

// Allowed file types for potential uploads
export const ALLOWED_FILE_TYPES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf', '.txt'],
  maxSize: 5 * 1024 * 1024 // 5MB
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
};

// Environment-specific configurations
export const getSecurityConfigForEnvironment = (env: string = process.env.NODE_ENV || 'development'): Partial<SecurityConfig> => {
  switch (env) {
    case 'production':
      return {
        monitoring: {
          enableSecurityLogs: true,
          logRetentionDays: 90,
          alertThresholds: {
            suspiciousActivity: 5,
            authFailures: 10,
            rateLimitExceeded: 3
          }
        }
      };
      
    case 'staging':
      return {
        monitoring: {
          enableSecurityLogs: true,
          logRetentionDays: 30,
          alertThresholds: {
            suspiciousActivity: 10,
            authFailures: 20,
            rateLimitExceeded: 5
          }
        }
      };
      
    case 'development':
    default:
      return {
        monitoring: {
          enableSecurityLogs: false,
          logRetentionDays: 7,
          alertThresholds: {
            suspiciousActivity: 100,
            authFailures: 100,
            rateLimitExceeded: 100
          }
        }
      };
  }
};

// Export merged configuration
export const getSecurityConfig = (): SecurityConfig => {
  const envConfig = getSecurityConfigForEnvironment();
  return {
    ...SECURITY_CONFIG,
    ...envConfig,
    monitoring: {
      ...SECURITY_CONFIG.monitoring,
      ...envConfig.monitoring
    }
  };
};