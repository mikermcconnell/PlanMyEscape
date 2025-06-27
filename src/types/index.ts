export type TripType = 'car camping' | 'canoe camping' | 'hike camping' | 'cottage';

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
  isCoordinated: boolean;
  groups: Group[];
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
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: 'food' | 'camping';
  isChecked: boolean;
  sourceItemId?: string;
  assignedGroupId?: string;
}

export interface Meal {
  id: string;
  name: string;
  day: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  ingredients: string[];
  servings: number;
  isCustom?: boolean;
  assignedGroupId?: string;
  sharedServings?: boolean;
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