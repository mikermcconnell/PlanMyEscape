import { Trip, TripType, PackingItem, Meal, GearItem, ShoppingItem, CampingGroup } from '../types';

const TRIPS_KEY = 'trips';
const PACKING_LIST_KEY_PREFIX = 'packing_list_';
const MEALS_KEY = 'campme_meals_';
const SHOPPING_LIST_KEY = 'shopping_list';

export const GROUP_COLORS = [
  '#4299E1', // Blue
  '#48BB78', // Green
  '#ED8936', // Orange
  '#9F7AEA', // Purple
  '#F56565'  // Red
];

type OldTripFormat = {
  id: string;
  groupSize?: number;
  type: 'car' | 'backcountry' | 'canoe' | TripType;
  startDate: string;
  endDate: string;
  tripName: string;
  description?: string;
};

// Trip Storage
export const getTrips = (): Trip[] => {
  const tripsJson = localStorage.getItem(TRIPS_KEY);
  return tripsJson ? JSON.parse(tripsJson) : [];
};

export const saveTrip = async (trip: Trip) => {
  const trips = await getTrips();
  const index = trips.findIndex(t => t.id === trip.id);
  if (index >= 0) {
    trips[index] = trip;
  } else {
    trips.push(trip);
  }
  await localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
};

export const saveTrips = async (trips: Trip[]) => {
  await localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
};

export const deleteTrip = (tripId: string) => {
  const trips = getTrips().filter(trip => trip.id !== tripId);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  
  // Clean up related data
  localStorage.removeItem(`${PACKING_LIST_KEY_PREFIX}${tripId}`);
  localStorage.removeItem(`${MEALS_KEY}${tripId}`);
  localStorage.removeItem(`${SHOPPING_LIST_KEY}${tripId}`);
};

// Packing List Storage
export const getPackingList = (tripId: string): PackingItem[] => {
  const listJson = localStorage.getItem(`${PACKING_LIST_KEY_PREFIX}${tripId}`);
  return listJson ? JSON.parse(listJson) : [];
};

export const savePackingList = (tripId: string, items: PackingItem[]) => {
  localStorage.setItem(`${PACKING_LIST_KEY_PREFIX}${tripId}`, JSON.stringify(items));
};

// Meals Storage
export const getMeals = (tripId: string): Meal[] => {
  const mealsJson = localStorage.getItem(`${MEALS_KEY}${tripId}`);
  return mealsJson ? JSON.parse(mealsJson) : [];
};

export const saveMeals = (tripId: string, meals: Meal[]) => {
  localStorage.setItem(`${MEALS_KEY}${tripId}`, JSON.stringify(meals));
};

// Gear storage
export const getGear = (): GearItem[] => {
  return JSON.parse(localStorage.getItem('gear') || '[]');
};

export const saveGear = (gear: GearItem): void => {
  const gearList = getGear();
  const existingIndex = gearList.findIndex(g => g.id === gear.id);
  
  if (existingIndex >= 0) {
    gearList[existingIndex] = gear;
  } else {
    gearList.push(gear);
  }
  
  localStorage.setItem('gear', JSON.stringify(gearList));
};

export const deleteGear = (gearId: string): void => {
  const gearList = getGear().filter(g => g.id !== gearId);
  localStorage.setItem('gear', JSON.stringify(gearList));
};

// Shopping List Storage
export const getShoppingList = (tripId: string): ShoppingItem[] => {
  const listJson = localStorage.getItem(`${SHOPPING_LIST_KEY}${tripId}`);
  return listJson ? JSON.parse(listJson) : [];
};

export const saveShoppingList = (tripId: string, items: ShoppingItem[]) => {
  localStorage.setItem(`${SHOPPING_LIST_KEY}${tripId}`, JSON.stringify(items));
};

export const addToShoppingList = (tripId: string, items: ShoppingItem[]) => {
  const currentList = getShoppingList(tripId);
  const newList = [...currentList];

  items.forEach(item => {
    const existingItem = newList.find(i => i.name === item.name && i.category === item.category);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      newList.push(item);
    }
  });

  saveShoppingList(tripId, newList);
};

export const removeFromShoppingList = (tripId: string, itemId: string): void => {
  const shoppingList = getShoppingList(tripId);
  const updatedList = shoppingList.filter(item => item.id !== itemId);
  saveShoppingList(tripId, updatedList);
};

export const toggleShoppingItem = (tripId: string, itemId: string): void => {
  const shoppingList = getShoppingList(tripId);
  const updatedList = shoppingList.map(item => 
    item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
  );
  saveShoppingList(tripId, updatedList);
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
        type: oldTrip.type === 'car' ? 'car camping' as TripType :
              oldTrip.type === 'backcountry' ? 'hike camping' as TripType :
              oldTrip.type === 'canoe' ? 'canoe camping' as TripType :
              oldTrip.type as TripType,
        groups: [newGroup],
        isCoordinated: false,
        tripName: (trip as any).parkName || oldTrip.tripName // Handle both old and new field names
      } as Trip;
    }
    // Handle old trip types and field rename
    if (oldTrip.type === 'car' || oldTrip.type === 'backcountry' || oldTrip.type === 'canoe' || (trip as any).parkName) {
      return {
        ...trip,
        type: oldTrip.type === 'car' ? 'car camping' as TripType :
              oldTrip.type === 'backcountry' ? 'hike camping' as TripType :
              oldTrip.type === 'canoe' ? 'canoe camping' as TripType :
              oldTrip.type as TripType,
        tripName: (trip as any).parkName || oldTrip.tripName // Handle both old and new field names
      } as Trip;
    }
    return trip;
  });
  await saveTrips(migratedTrips);
}; 