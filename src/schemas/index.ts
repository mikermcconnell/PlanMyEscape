import { z } from 'zod';
import { sanitizeInput } from '../utils/validation';

// Basic schemas
const GroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  size: z.number().int().positive(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i)
});

export const TripSchema = z.object({
  id: z.string().min(1),
  tripName: z.string().min(1).max(100).transform(sanitizeInput),
  tripType: z.enum(['car camping', 'canoe camping', 'hike camping', 'cottage']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(500).transform(sanitizeInput).optional(),
  location: z.string().max(200).transform(sanitizeInput).optional(),
  isCoordinated: z.boolean(),
  groups: z.array(GroupSchema),
  activities: z.array(z.any()).optional(),
  emergencyContacts: z.array(z.any()).optional()
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

export const PackingItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.string().min(1),
  quantity: z.number().int().positive(),
  isChecked: z.boolean(),
  weight: z.number().optional(),
  isOwned: z.boolean(),
  needsToBuy: z.boolean(),
  isPacked: z.boolean(),
  required: z.boolean(),
  assignedGroupId: z.string().optional()
});

export const MealSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  day: z.number().int().min(1),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  ingredients: z.array(z.string()),
  servings: z.number().int().positive(),
  isCustom: z.boolean()
});

export const GearItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  category: z.string().min(1),
  weight: z.number().optional(),
  notes: z.string().max(500).optional(),
  assignedTrips: z.array(z.string())
});

export const ShoppingItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  quantity: z.number().int().positive(),
  category: z.enum(['food', 'camping']),
  isChecked: z.boolean(),
  sourceItemId: z.string().optional()
});

// Helper function to validate data
export const validateData = <T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}; 