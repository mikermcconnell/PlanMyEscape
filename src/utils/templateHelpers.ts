import { PackingItem, Meal, PackingTemplate, MealTemplate, Trip, TripType } from '../types';

/**
 * Helper functions for creating and loading templates from trip data
 */

export const createPackingTemplate = (
  tripName: string,
  tripType: TripType,
  packingItems: PackingItem[]
): PackingTemplate => {
  // Filter out user-specific data and reset status flags
  const templateItems = packingItems.map(item => ({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    weight: item.weight,
    isOwned: false, // Reset ownership status
    needsToBuy: true, // Default to needs buying for new trips
    isPacked: false, // Reset packed status
    required: item.required,
    isPersonal: item.isPersonal,
    notes: item.notes
  }));

  return {
    id: crypto.randomUUID(),
    name: tripName,
    tripType,
    items: templateItems,
    createdAt: new Date().toISOString()
  };
};

export const createMealTemplate = (
  tripName: string,
  tripType: TripType,
  tripDuration: number,
  meals: Meal[]
): MealTemplate => {
  // Filter out user-specific data and normalize days
  const templateMeals = meals.map(meal => ({
    name: meal.name,
    day: meal.day,
    type: meal.type,
    ingredients: [...meal.ingredients], // Create copy of ingredients
    isCustom: meal.isCustom,
    sharedServings: meal.sharedServings,
    servings: meal.servings
  }));

  return {
    id: crypto.randomUUID(),
    name: tripName,
    tripType,
    tripDuration,
    meals: templateMeals,
    createdAt: new Date().toISOString()
  };
};

export const loadPackingTemplate = (
  template: PackingTemplate,
  tripId: string,
  trip: Trip
): PackingItem[] => {
  return template.items.map(templateItem => ({
    id: crypto.randomUUID(),
    name: templateItem.name,
    category: templateItem.category,
    quantity: templateItem.quantity,
    weight: templateItem.weight,
    required: templateItem.required,
    isPersonal: templateItem.isPersonal,
    notes: templateItem.notes,
    // Reset all status flags when loading a template
    isOwned: false,     // Start with no ownership status
    needsToBuy: false,  // Start with no purchase needed status
    isChecked: false,   // Always start unchecked
    isPacked: false,    // Always start unpacked
    assignedGroupId: trip.groups.length > 0 ? trip.groups[0]?.id : undefined, // Assign to first group by default
    packedByUserId: undefined,
    lastModifiedBy: undefined,
    lastModifiedAt: new Date().toISOString()
  }));
};

export const loadMealTemplate = (
  template: MealTemplate,
  tripId: string,
  trip: Trip,
  actualTripDuration?: number
): Meal[] => {
  const targetDuration = actualTripDuration || template.tripDuration;
  const scaleFactor = targetDuration / template.tripDuration;
  
  return template.meals.map(templateMeal => {
    // Scale the day if trip duration is different
    let adjustedDay = templateMeal.day;
    if (scaleFactor !== 1) {
      adjustedDay = Math.ceil(templateMeal.day * scaleFactor);
      // Ensure day doesn't exceed trip duration
      adjustedDay = Math.min(adjustedDay, targetDuration);
    }
    
    return {
      id: crypto.randomUUID(),
      ...templateMeal,
      day: adjustedDay,
      assignedGroupId: trip.groups.length > 0 ? trip.groups[0]?.id : undefined, // Assign to first group by default
      ingredients: [...templateMeal.ingredients], // Create fresh copy
      lastModifiedBy: undefined,
      lastModifiedAt: new Date().toISOString()
    };
  });
};

/**
 * Get trip duration in days from start and end dates
 */
export const getTripDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
};

/**
 * Check if a template is compatible with the current trip type
 */
export const isTemplateCompatible = (templateTripType: TripType, currentTripType: TripType): boolean => {
  // Exact match is always compatible
  if (templateTripType === currentTripType) return true;
  
  // Define compatibility groups
  const campingTypes = ['car camping', 'canoe camping', 'hike camping'];
  const indoorTypes = ['cottage'];
  
  // Check if both types are in the same compatibility group
  if (campingTypes.includes(templateTripType) && campingTypes.includes(currentTripType)) {
    return true;
  }
  
  if (indoorTypes.includes(templateTripType) && indoorTypes.includes(currentTripType)) {
    return true;
  }
  
  return false;
};

/**
 * Filter templates to show only compatible ones for the current trip
 */
export const filterCompatibleTemplates = <T extends { tripType: TripType }>(
  templates: T[], 
  currentTripType: TripType
): T[] => {
  return templates.filter(template => isTemplateCompatible(template.tripType, currentTripType));
};

/**
 * Generate a summary of what will be loaded from a template
 */
export const getPackingTemplateSummary = (template: PackingTemplate): string => {
  const itemCount = template.items.length;
  const categories = [...new Set(template.items.map(item => item.category))];
  const categoryCount = categories.length;
  
  return `${itemCount} items across ${categoryCount} categories (${categories.slice(0, 3).join(', ')}${categoryCount > 3 ? '...' : ''})`;
};

export const getMealTemplateSummary = (template: MealTemplate): string => {
  const mealCount = template.meals.length;
  const mealTypes = [...new Set(template.meals.map(meal => meal.type))];
  const customCount = template.meals.filter(meal => meal.isCustom).length;
  
  let summary = `${mealCount} meals for ${template.tripDuration} days (${mealTypes.join(', ')})`;
  if (customCount > 0) {
    summary += ` including ${customCount} custom recipe${customCount > 1 ? 's' : ''}`;
  }
  
  return summary;
};