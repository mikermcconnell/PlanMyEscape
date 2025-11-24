export const TRIP_TYPES = ['car camping', 'canoe camping', 'hike camping', 'cottage', 'day hike'] as const;
export type TripTypeOption = typeof TRIP_TYPES[number];
export type TripType = TripTypeOption;

export interface Group {
  id: string;
  name: string;
  size: number;
  contactName?: string;
  contactEmail?: string;
  color: GroupColor;
}

export interface Trip {
  id: string;
  tripName: string;
  tripType: TripType;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
  isCoordinated: boolean;
  groups: Group[];
  activities?: Activity[];
  emergencyContacts?: EmergencyContact[];
}

export interface Activity {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor' | 'water' | 'entertainment';
  equipment?: string[];
  notes?: string;
  schedules?: { day: number; timeOfDay: string }[];
  isCompleted?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'park_services' | 'local_services';
  phone: string;
  address?: string;
}

export interface PackingItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  quantity: number;
  weight?: number;
  isOwned: boolean;
  needsToBuy: boolean;
  isPacked: boolean;
  required: boolean;
  assignedGroupId?: string; // Deprecated - kept for backward compatibility
  assignedGroupIds?: string[]; // New: supports multiple group assignments
  isPersonal: boolean; // true for personal items (per person), false for group items (shared)
  packedByUserId?: string; // ID of user who packed this item
  lastModifiedBy?: string; // ID of user who last modified this item
  lastModifiedAt?: string; // Timestamp of last modification
  notes?: string; // User notes for this item
  sourceActivityIds?: string[]; // Activity IDs that generated this item
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: 'food' | 'camping';
  isChecked?: boolean;
  /** Whether the user already owns this ingredient/equipment */
  isOwned?: boolean;
  /** Whether the user still needs to purchase this ingredient/equipment */
  needsToBuy?: boolean;
  sourceItemId?: string;
  assignedGroupId?: string;
  cost?: number;
  paidByGroupId?: string;
  paidByUserName?: string;
  splits?: CostSplit[];
}

export interface CostSplit {
  groupId: string;
  amount: number;
}

export interface Settlement {
  fromGroupId: string;
  toGroupId: string;
  amount: number;
  description: string;
  isSettled?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  day: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: string[];
  isCustom?: boolean;
  assignedGroupId?: string;
  sharedServings?: boolean;
  servings?: number;
  lastModifiedBy?: string; // ID of user who last modified this meal
  lastModifiedAt?: string; // Timestamp of last modification
}

export interface RecipeSuggestion {
  name: string;
  baseIngredients: string[];
  optionalIngredients: string[];
  instructions: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingMethod: string[];
  servings: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface CampingGroup {
  id: string;
  name: string;
  size: number;
  contactName: string;
  contactEmail?: string;
  color: GroupColor;
}

export interface GearItem {
  id: string;
  name: string;
  category: string;
  weight?: number;
  notes?: string;
  assignedTrips: string[];
}

export const GROUP_COLORS = [
  '#4299E1',
  '#48BB78',
  '#ED8936',
  '#9F7AEA',
  '#F56565',
  '#38B2AC',
  '#ED64A6',
  '#ECC94B',
] as const;

export type GroupColor = typeof GROUP_COLORS[number];

export interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  displayOrder: number;
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  created_at: string;
  updated_at?: string;
}

// Template interfaces for saving trip data as reusable templates
export interface PackingTemplate {
  id: string;
  name: string; // Trip name this template was created from
  tripType: TripType;
  items: Omit<PackingItem, 'id' | 'isPacked' | 'assignedGroupId' | 'packedByUserId' | 'lastModifiedBy' | 'lastModifiedAt'>[];
  createdAt: string;
  userId?: string;
}

export interface MealTemplate {
  id: string;
  name: string; // Trip name this template was created from
  tripType: TripType;
  tripDuration: number; // Number of days
  meals: Omit<Meal, 'id' | 'assignedGroupId' | 'lastModifiedBy' | 'lastModifiedAt'>[];
  createdAt: string;
  userId?: string;
}

// Explicit export to ensure type is available
export type { MealTemplate as MealTemplateType };

export interface PackingSuggestion {
  name: string;
  category: string;
  subcategory?: string;
  required: boolean;
  quantity?: number;
}
