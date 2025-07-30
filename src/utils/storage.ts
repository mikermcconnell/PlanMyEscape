import { Trip, PackingItem, Meal, GearItem, ShoppingItem, CampingGroup, GROUP_COLORS, GroupColor, Group } from '../types';
import { TripSchema, PackingItemSchema, MealSchema, GearItemSchema, ShoppingItemSchema, validateData } from '../schemas';
import { getPackingTemplate } from '../data/packingTemplates';
import {
  getTripsFromDB,
  saveTripToDB,
  deleteTripFromDB,
  getPackingListFromDB,
  savePackingListToDB,
  getMealsFromDB,
  saveMealsToDB,
  getGearFromDB,
  saveGearToDB,
  deleteGearFromDB,
  getShoppingListFromDB,
  saveShoppingListToDB,
  addToShoppingListDB,
  getDeletedIngredientsFromDB,
  saveDeletedIngredientsToDB,
  initDB
} from './db';

// Initialize database
initDB().catch(console.error);

// Generate unique IDs
export const generateId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() : 
    Date.now().toString(36) + Math.random().toString(36).substr(2);
};

type OldTripFormat = {
  id: string;
  groupSize?: number;
  type: 'car' | 'backcountry' | 'canoe' | string;
  startDate: string;
  endDate: string;
  tripName: string;
  description?: string;
};

// Trip Storage
export const getTrips = async (): Promise<Trip[]> => {
  try {
    const trips = await getTripsFromDB();
    // Ensure all group colors are valid GroupColor
    return trips.map(trip => ({
      ...trip,
      groups: trip.groups.map(coerceToGroup)
    })) as Trip[];
  } catch (error) {
    console.error('Failed to get trips:', error);
    return [];
  }
};

export const saveTrip = async (trip: Trip): Promise<boolean> => {
  // Ensure all group colors are valid before saving
  const safeTrip = {
    ...trip,
    groups: trip.groups.map(group => ({
      ...group,
      color: toGroupColor(group.color)
    }))
  };
  const validation = validateData(TripSchema, safeTrip);
  if (!validation.success) {
    console.error('Invalid trip data:', validation.error);
    return false;
  }

  try {
    await saveTripToDB(validation.data as Trip);
    return true;
  } catch (error) {
    console.error('Failed to save trip:', error);
    return false;
  }
};

export const saveTrips = async (trips: Trip[]): Promise<boolean> => {
  try {
    for (const trip of trips) {
      // Ensure all group colors are valid before saving
      const safeTrip = {
        ...trip,
        groups: trip.groups.map(group => ({
          ...group,
          color: toGroupColor(group.color)
        }))
      };
      const validation = validateData(TripSchema, safeTrip);
      if (!validation.success) {
        console.error('Invalid trip data:', validation.error);
        return false;
      }
      await saveTripToDB(validation.data as Trip);
    }
    return true;
  } catch (error) {
    console.error('Failed to save trips:', error);
    return false;
  }
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  try {
    await deleteTripFromDB(tripId);
  } catch (error) {
    console.error('Failed to delete trip:', error);
  }
};

// Packing List Storage
export const getPackingList = async (tripId: string): Promise<PackingItem[]> => {
  try {
    const items = await getPackingListFromDB(tripId);
    return items;
  } catch (error) {
    console.error('Failed to get packing list:', error);
    return [];
  }
};

export const savePackingList = async (tripId: string, items: PackingItem[]): Promise<boolean> => {
  try {
    for (const item of items) {
      const validation = validateData(PackingItemSchema, item);
      if (!validation.success) {
        console.error('Invalid packing item:', validation.error);
        return false;
      }
    }
    await savePackingListToDB(tripId, items);
    return true;
  } catch (error) {
    console.error('Failed to save packing list:', error);
    return false;
  }
};

// Meals Storage
export const getMeals = async (tripId: string): Promise<Meal[]> => {
  try {
    const meals = await getMealsFromDB(tripId);
    return meals;
  } catch (error) {
    console.error('Failed to get meals:', error);
    return [];
  }
};

export const saveMeals = async (tripId: string, meals: Meal[]): Promise<boolean> => {
  try {
    for (const meal of meals) {
      const validation = validateData(MealSchema, meal);
      if (!validation.success) {
        console.error('Invalid meal data:', validation.error);
        return false;
      }
    }
    await saveMealsToDB(tripId, meals);
    return true;
  } catch (error) {
    console.error('Failed to save meals:', error);
    return false;
  }
};

// Gear Storage
export const getGear = async (): Promise<GearItem[]> => {
  try {
    const gear = await getGearFromDB();
    return gear;
  } catch (error) {
    console.error('Failed to get gear:', error);
    return [];
  }
};

export const saveGear = async (gear: GearItem): Promise<boolean> => {
  const validation = validateData(GearItemSchema, gear);
  if (!validation.success) {
    console.error('Invalid gear data:', validation.error);
    return false;
  }

  try {
    await saveGearToDB(validation.data);
    return true;
  } catch (error) {
    console.error('Failed to save gear:', error);
    return false;
  }
};

export const deleteGear = async (gearId: string): Promise<void> => {
  try {
    await deleteGearFromDB(gearId);
  } catch (error) {
    console.error('Failed to delete gear:', error);
  }
};

// Shopping List Storage
export const getShoppingList = async (tripId: string): Promise<ShoppingItem[]> => {
  try {
    const items = await getShoppingListFromDB(tripId);
    return items;
  } catch (error) {
    console.error('Failed to get shopping list:', error);
    return [];
  }
};

export const saveShoppingList = async (tripId: string, items: ShoppingItem[]): Promise<boolean> => {
  try {
    for (const item of items) {
      const validation = validateData(ShoppingItemSchema, item);
      if (!validation.success) {
        console.error('Invalid shopping item:', validation.error);
        return false;
      }
    }
    await saveShoppingListToDB(tripId, items);
    return true;
  } catch (error) {
    console.error('Failed to save shopping list:', error);
    return false;
  }
};

export const addToShoppingList = async (tripId: string, items: ShoppingItem[]): Promise<boolean> => {
  try {
    for (const item of items) {
      const validation = validateData(ShoppingItemSchema, item);
      if (!validation.success) {
        console.error('Invalid shopping item:', validation.error);
        return false;
      }
    }
    await addToShoppingListDB(tripId, items);
    return true;
  } catch (error) {
    console.error('Failed to add to shopping list:', error);
    return false;
  }
};

export const removeFromShoppingList = async (tripId: string, itemId: string): Promise<void> => {
  const shoppingList = await getShoppingList(tripId);
  const updatedList = shoppingList.filter(item => item.id !== itemId);
  await saveShoppingList(tripId, updatedList);
};

export const toggleShoppingItem = async (tripId: string, itemId: string): Promise<void> => {
  const shoppingList = await getShoppingList(tripId);
  const updatedList = shoppingList.map(item => 
    item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
  );
  await saveShoppingList(tripId, updatedList);
};

// Utility to ensure group color is a valid GroupColor
export function toGroupColor(color: string): GroupColor {
  return (GROUP_COLORS as readonly string[]).includes(color)
    ? (color as GroupColor)
    : GROUP_COLORS[0];
}

// Helper to coerce any raw group object to a valid Group
function coerceToGroup(group: any): Group {
  return {
    id: group.id,
    name: group.name,
    size: group.size,
    contactName: group.contactName,
    contactEmail: group.contactEmail,
    color: toGroupColor(group.color)
  };
}

// Deleted Ingredients Storage
export const getDeletedIngredients = async (tripId: string): Promise<string[]> => {
  try {
    const deletedIngredients = await getDeletedIngredientsFromDB(tripId);
    return deletedIngredients || [];
  } catch (error) {
    console.error('Failed to get deleted ingredients:', error);
    return [];
  }
};

export const saveDeletedIngredients = async (tripId: string, deletedIngredients: string[]): Promise<boolean> => {
  try {
    await saveDeletedIngredientsToDB(tripId, deletedIngredients);
    return true;
  } catch (error) {
    console.error('Failed to save deleted ingredients:', error);
    return false;
  }
};

// Data Recovery Functions
export const recoverPackingData = async (tripId: string, trip: Trip): Promise<boolean> => {
  try {
    const existingItems = await getPackingList(tripId);
    
    // If empty, restore from template
    if (existingItems.length === 0) {
      console.log('Recovering packing data from template for trip:', trip.tripName);
      
      const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);
      const tripDays = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 2;
      const templateItems = getPackingTemplate(trip.tripType, totalCampers, tripDays);
      
      await savePackingList(tripId, templateItems);
      console.log(`Recovered ${templateItems.length} packing items from template`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to recover packing data:', error);
    return false;
  }
};

export const recoverMealsData = async (tripId: string, trip: Trip): Promise<boolean> => {
  try {
    const existingMeals = await getMeals(tripId);
    
    // If empty, could restore some basic meal templates
    if (existingMeals.length === 0) {
      console.log('No meals to recover - user will need to recreate meals');
      // Note: Meal templates are more complex and user-specific, 
      // so we don't auto-restore them like packing items
      return false;
    }
    return false;
  } catch (error) {
    console.error('Failed to check meals data:', error);
    return false;
  }
};

// Helper function to migrate old data structure to new one if needed
export const migrateTrips = async () => {
  const trips = await getTrips();
  const migratedTrips = trips.map(trip => {
    // Handle old trip format without groups
    const oldTrip = trip as unknown as OldTripFormat;
    if (!trip.groups) {
      const newGroup: CampingGroup = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'Main Group',
        size: oldTrip.groupSize || 1,
        contactName: '',
        color: GROUP_COLORS[0]
      };

      return {
        ...trip,
        tripType: oldTrip.type === 'car' ? 'car camping' :
                  oldTrip.type === 'backcountry' ? 'hike camping' :
                  oldTrip.type === 'canoe' ? 'canoe camping' :
                  oldTrip.type,
        groups: [newGroup],
        isCoordinated: false,
        tripName: (trip as any).parkName || oldTrip.tripName // Handle both old and new field names
      } as Trip;
    }
    // Handle old trip types and field rename
    if (oldTrip.type === 'car' || oldTrip.type === 'backcountry' || oldTrip.type === 'canoe' || (trip as any).parkName) {
      return {
        ...trip,
        tripType: oldTrip.type === 'car' ? 'car camping' :
                  oldTrip.type === 'backcountry' ? 'hike camping' :
                  oldTrip.type === 'canoe' ? 'canoe camping' :
                  oldTrip.type,
        tripName: (trip as any).parkName || oldTrip.tripName // Handle both old and new field names
      } as Trip;
    }
    // Ensure all group colors are valid
    if (trip.groups) {
      return {
        ...trip,
        groups: trip.groups.map(group => ({
          ...group,
          color: toGroupColor(group.color)
        }) as Group)
      };
    }
    return trip;
  });
  await saveTrips(migratedTrips);
}; 