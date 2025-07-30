// @ts-nocheck
// Server-side only middleware, excluded from browser bundle
import rateLimit from 'express-rate-limit';

/**
 * authRateLimit – limits login attempts to mitigate brute-force attacks.
 * Intended for use in an Express / serverless function context.
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
}); 