export const TRIP_TYPES = ['car camping', 'canoe camping', 'hike camping', 'cottage'] as const;
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
  quantity: number;
  isChecked: boolean;
  weight?: number;
  isOwned: boolean;
  needsToBuy: boolean;
  isPacked: boolean;
  required: boolean;
  assignedGroupId?: string;
  isPersonal: boolean; // true for personal items (per person), false for group items (shared)
  packedByUserId?: string; // ID of user who packed this item
  lastModifiedBy?: string; // ID of user who last modified this item
  lastModifiedAt?: string; // Timestamp of last modification
  notes?: string; // User notes for this item
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
  // Cost splitting features
  cost?: number;
  currency?: string;
  paidByGroupId?: string;
  paidByUserName?: string;
  splitType?: 'equal' | 'custom' | 'by_group';
  splits?: ItemSplit[];
  receiptUrl?: string;
  purchaseDate?: string;
  notes?: string;
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

// Cost splitting types
export interface ItemSplit {
  groupId: string;
  groupName: string;
  amount: number;
  isSettled?: boolean;
}

export interface ExpenseSummary {
  groupId: string;
  groupName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number; // positive = owed money, negative = owes money
}

export interface Settlement {
  id: string;
  fromGroupId: string;
  toGroupId: string;
  amount: number;
  currency: string;
  description: string;
  isSettled: boolean;
  settledDate?: string;
  createdDate: string;
}

export interface ExpenseMetrics {
  totalCost: number;
  totalPaid: number;
  totalPending: number;
  currency: string;
  settlements: Settlement[];
} 