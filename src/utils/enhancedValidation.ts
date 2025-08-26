import { z } from 'zod';
import { useState, useCallback } from 'react';

// Enhanced Trip validation schemas
export const EnhancedTripSchema = z.object({
  id: z.string().uuid(),
  tripName: z.string()
    .min(1, 'Trip name is required')
    .max(100, 'Trip name too long')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()\[\]]+$/, 'Trip name contains invalid characters'),
  tripType: z.enum(['car camping', 'canoe camping', 'hike camping', 'cottage']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().max(500).optional(),
  location: z.string()
    .max(200)
    .regex(/^[a-zA-Z0-9\s\-_.,#()&]*$/, 'Location contains invalid characters')
    .optional(),
  isCoordinated: z.boolean(),
  groups: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    size: z.number().int().min(1).max(50),
    contactName: z.string().max(100).optional(),
    contactEmail: z.string().email().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
  })).max(10)
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Enhanced Packing Item schema with business rules
export const EnhancedPackingItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
    .min(1, 'Item name is required')
    .max(100, 'Item name too long'),
  category: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(999),
  isChecked: z.boolean(),
  weight: z.number().min(0).max(100000).optional(), // in grams
  isOwned: z.boolean(),
  needsToBuy: z.boolean(),
  isPacked: z.boolean(),
  required: z.boolean(),
  assignedGroupId: z.string().uuid().optional(),
  isPersonal: z.boolean(),
  notes: z.string().max(500).optional()
}).refine(data => {
  // Can't be packed if not owned
  if (data.isPacked && !data.isOwned) {
    return false;
  }
  return true;
}, {
  message: "Item must be owned before it can be packed",
  path: ["isPacked"]
}).refine(data => {
  // Can't need to buy if already owned
  if (data.needsToBuy && data.isOwned) {
    return false;
  }
  return true;
}, {
  message: "Can't need to buy an item that's already owned",
  path: ["needsToBuy"]
});

// Form validation schemas
export const SignUpSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Expense validation
export const ExpenseSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(99999, 'Amount too large')
    .multipleOf(0.01, 'Amount must have at most 2 decimal places'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description too long'),
  paidBy: z.string().uuid(),
  splitAmong: z.array(z.string().uuid()).min(1, 'Must split among at least one person'),
  date: z.string().datetime()
});

// Custom validation hook with field-level and form-level validation
export const useFormValidation = <T extends z.ZodType<any, any>>(
  schema: T,
  options?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    revalidateOnSubmit?: boolean;
  }
) => {
  type SchemaType = z.infer<T>;
  
  const {
    validateOnChange = true,
    validateOnBlur = true,
    revalidateOnSubmit = true
  } = options || {};

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate a single field
  const validateField = useCallback(async (
    fieldName: string,
    value: any,
    allValues: Partial<SchemaType>
  ): Promise<boolean> => {
    try {
      // Try to validate the entire object to catch cross-field dependencies
      await schema.parseAsync({ ...allValues, [fieldName]: value });
      
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.errors
          .filter(err => err.path[0] === fieldName)
          .map(err => err.message);
        
        if (fieldErrors.length > 0) {
          setErrors(prev => ({
            ...prev,
            [fieldName]: fieldErrors
          }));
          return false;
        }
      }
      return true;
    }
  }, [schema]);

  // Validate entire form
  const validateForm = useCallback(async (
    values: Partial<SchemaType>
  ): Promise<{ isValid: boolean; errors: Record<string, string[]> }> => {
    setIsValidating(true);
    
    try {
      await schema.parseAsync(values);
      setErrors({});
      setIsValid(true);
      setIsValidating(false);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string[]> = {};
        
        error.errors.forEach(err => {
          const field = String(err.path[0] || 'form');
          if (!newErrors[field]) {
            newErrors[field] = [];
          }
          newErrors[field]!.push(err.message);
        });
        
        setErrors(newErrors);
        setIsValid(false);
        setIsValidating(false);
        return { isValid: false, errors: newErrors };
      }
      
      setIsValidating(false);
      return { isValid: false, errors: {} };
    }
  }, [schema]);

  // Handle field change
  const handleChange = useCallback(async (
    fieldName: string,
    value: any,
    allValues: Partial<SchemaType>
  ) => {
    if (validateOnChange && touched[fieldName]) {
      await validateField(fieldName, value, allValues);
    }
  }, [validateField, validateOnChange, touched]);

  // Handle field blur
  const handleBlur = useCallback(async (
    fieldName: string,
    value: any,
    allValues: Partial<SchemaType>
  ) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    if (validateOnBlur) {
      await validateField(fieldName, value, allValues);
    }
  }, [validateField, validateOnBlur]);

  // Handle form submission
  const handleSubmit = useCallback(async (
    values: Partial<SchemaType>,
    onSuccess: (data: SchemaType) => void | Promise<void>
  ) => {
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);

    // Validate form
    const { isValid, errors } = await validateForm(values);
    
    if (isValid) {
      try {
        const validatedData = await schema.parseAsync(values);
        await onSuccess(validatedData);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  }, [validateForm, schema]);

  // Reset form state
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValid(false);
    setIsValidating(false);
  }, []);

  // Get field error
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName]?.[0] : undefined;
  }, [errors, touched]);

  // Get all field errors
  const getFieldErrors = useCallback((fieldName: string): string[] => {
    return touched[fieldName] ? (errors[fieldName] || []) : [];
  }, [errors, touched]);

  return {
    errors,
    touched,
    isValidating,
    isValid,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldError,
    getFieldErrors,
    setFieldTouched: (field: string, touched: boolean) => {
      setTouched(prev => ({ ...prev, [field]: touched }));
    },
    setFieldError: (field: string, error: string) => {
      setErrors(prev => ({ ...prev, [field]: [error] }));
    }
  };
};

// Validation utilities
export const validationUtils = {
  /**
   * Check if value is a valid UUID
   */
  isUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Check if value is a valid hex color
   */
  isHexColor: (value: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(value);
  },

  /**
   * Check if date is in the future
   */
  isFutureDate: (date: Date | string): boolean => {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    return checkDate > new Date();
  },

  /**
   * Check if date range is valid
   */
  isValidDateRange: (start: Date | string, end: Date | string): boolean => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    return startDate < endDate;
  },

  /**
   * Calculate trip duration in days
   */
  getTripDuration: (start: Date | string, end: Date | string): number => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  },

  /**
   * Format validation errors for display
   */
  formatErrors: (errors: z.ZodError): Record<string, string> => {
    const formatted: Record<string, string> = {};
    errors.errors.forEach(error => {
      const field = error.path.join('.');
      formatted[field] = error.message;
    });
    return formatted;
  }
};