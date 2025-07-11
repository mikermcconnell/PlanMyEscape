export const TRIP_TYPES = ['car camping', 'canoe camping', 'hike camping', 'cottage'] as const;
export type TripTypeOption = typeof TRIP_TYPES[number];
export type TripType = TripTypeOption;

export interface Group {
  id: string;
  name: string;
  size: number;
  contactName?: string;
  contactEmail?: string;
  color: string;
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
  quantity: number;
  isChecked: boolean;
  weight?: number;
  isOwned: boolean;
  needsToBuy: boolean;
  isPacked: boolean;
  required: boolean;
  assignedGroupId?: string;
  isPersonal: boolean; // true for personal items (per person), false for group items (shared)
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
  color: string;
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