import DOMPurify from 'dompurify';
import { detectSuspiciousActivity, SecurityError } from './errorHandler';

/**
 * Enhanced input validation and sanitization for production security
 */

/**
 * Trim and sanitize arbitrary user input to prevent XSS attacks.
 * All HTML tags and scripts are stripped.
 */
export const sanitizeInput = (input: string, context: string = 'general_input'): string => {
  if (typeof input !== 'string') {
    throw new SecurityError('Invalid input type', 'Please provide valid text input');
  }

  // Check for suspicious patterns before sanitization
  detectSuspiciousActivity(input, context);

  // Configure DOMPurify for strict sanitization
  const cleanInput = DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    SANITIZE_DOM: true // Extra DOM security
  });

  return cleanInput;
};

/**
 * Validate and sanitize trip names
 */
export const validateTripName = (name: string): string => {
  const sanitized = sanitizeInput(name, 'trip_name');
  
  if (sanitized.length < 1) {
    throw new SecurityError('Trip name too short', 'Trip name must be at least 1 character long');
  }
  
  if (sanitized.length > 100) {
    throw new SecurityError('Trip name too long', 'Trip name must be less than 100 characters');
  }

  // Check for valid characters (letters, numbers, spaces, basic punctuation)
  const validNamePattern = /^[a-zA-Z0-9\s\-_.,!?()\[\]]+$/;
  if (!validNamePattern.test(sanitized)) {
    throw new SecurityError('Invalid characters in trip name', 'Trip name contains invalid characters');
  }

  return sanitized;
};

/**
 * Validate and sanitize location names
 */
export const validateLocation = (location: string): string => {
  const sanitized = sanitizeInput(location, 'location');
  
  if (sanitized.length > 200) {
    throw new SecurityError('Location too long', 'Location must be less than 200 characters');
  }

  // Allow letters, numbers, spaces, and common location punctuation
  const validLocationPattern = /^[a-zA-Z0-9\s\-_.,#()&]+$/;
  if (sanitized.length > 0 && !validLocationPattern.test(sanitized)) {
    throw new SecurityError('Invalid characters in location', 'Location contains invalid characters');
  }

  return sanitized;
};

/**
 * Validate email addresses with enhanced security
 */
export const validateEmail = (email: string): string => {
  if (typeof email !== 'string') {
    throw new SecurityError('Invalid email type', 'Please provide a valid email address');
  }

  const sanitized = email.trim().toLowerCase();
  
  // Check for suspicious patterns
  detectSuspiciousActivity(sanitized, 'email_input');

  // Enhanced email validation
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailPattern.test(sanitized)) {
    throw new SecurityError('Invalid email format', 'Please provide a valid email address');
  }

  if (sanitized.length > 254) {
    throw new SecurityError('Email too long', 'Email address is too long');
  }

  if (sanitized.length < 5) {
    throw new SecurityError('Email too short', 'Email address is too short');
  }

  return sanitized;
};

/**
 * Validate meal names and ingredients
 */
export const validateMealInput = (input: string, fieldName: string = 'meal'): string => {
  const sanitized = sanitizeInput(input, `meal_${fieldName}`);
  
  if (sanitized.length > 100) {
    throw new SecurityError(`${fieldName} too long`, `${fieldName} must be less than 100 characters`);
  }

  // Allow food-related characters
  const validFoodPattern = /^[a-zA-Z0-9\s\-_.,()&/]+$/;
  if (sanitized.length > 0 && !validFoodPattern.test(sanitized)) {
    throw new SecurityError(`Invalid characters in ${fieldName}`, `${fieldName} contains invalid characters`);
  }

  return sanitized;
};

/**
 * Validate activity names and descriptions
 */
export const validateActivityInput = (input: string, fieldName: string = 'activity'): string => {
  const sanitized = sanitizeInput(input, `activity_${fieldName}`);
  
  if (sanitized.length > 200) {
    throw new SecurityError(`${fieldName} too long`, `${fieldName} must be less than 200 characters`);
  }

  // Allow activity-related characters
  const validActivityPattern = /^[a-zA-Z0-9\s\-_.,()&/!?]+$/;
  if (sanitized.length > 0 && !validActivityPattern.test(sanitized)) {
    throw new SecurityError(`Invalid characters in ${fieldName}`, `${fieldName} contains invalid characters`);
  }

  return sanitized;
};

/**
 * Validate numeric inputs (quantities, etc.)
 */
export const validateNumericInput = (value: any, fieldName: string, min: number = 0, max: number = 999999): number => {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new SecurityError('Invalid numeric input', `${fieldName} must be a valid number`);
  }

  if (num < min) {
    throw new SecurityError(`${fieldName} too small`, `${fieldName} must be at least ${min}`);
  }

  if (num > max) {
    throw new SecurityError(`${fieldName} too large`, `${fieldName} must be at most ${max}`);
  }

  return num;
};

/**
 * Validate date inputs
 */
export const validateDateInput = (dateString: string, fieldName: string = 'date'): Date => {
  if (typeof dateString !== 'string') {
    throw new SecurityError('Invalid date format', `${fieldName} must be a valid date string`);
  }

  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new SecurityError('Invalid date', `${fieldName} must be a valid date`);
  }

  // Check for reasonable date range (not before 1900 or more than 10 years in future)
  const minDate = new Date('1900-01-01');
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);

  if (date < minDate || date > maxDate) {
    throw new SecurityError('Date out of range', `${fieldName} must be within a reasonable date range`);
  }

  return date;
};

/**
 * Validate and sanitize notes/comments
 */
export const validateNotes = (notes: string): string => {
  const sanitized = sanitizeInput(notes, 'notes');
  
  if (sanitized.length > 2000) {
    throw new SecurityError('Notes too long', 'Notes must be less than 2000 characters');
  }

  return sanitized;
};

/**
 * Validate file names (for potential file upload features)
 */
export const validateFileName = (fileName: string): string => {
  if (typeof fileName !== 'string') {
    throw new SecurityError('Invalid file name type', 'File name must be a string');
  }

  const sanitized = fileName.trim();
  
  // Check for path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
    throw new SecurityError('Invalid file name', 'File name contains invalid path characters');
  }

  // Only allow safe characters
  const validFileNamePattern = /^[a-zA-Z0-9\-_. ]+$/;
  if (!validFileNamePattern.test(sanitized)) {
    throw new SecurityError('Invalid file name characters', 'File name contains invalid characters');
  }

  if (sanitized.length > 255) {
    throw new SecurityError('File name too long', 'File name must be less than 255 characters');
  }

  return sanitized;
}; 