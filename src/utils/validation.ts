import DOMPurify from 'dompurify';

/**
 * Trim and sanitize arbitrary user input to prevent XSS attacks.
 * All HTML tags and scripts are stripped.
 */
export const sanitizeInput = (input: string): string => {
  // DOMPurify.sanitize guarantees a string return
  return DOMPurify.sanitize(input.trim());
}; 