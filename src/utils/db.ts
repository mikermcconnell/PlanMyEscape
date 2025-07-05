import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Trip, PackingItem, Meal, GearItem, ShoppingItem } from '../types';

interface PlanMyEscapeDB extends DBSchema {
  trips: {
    key: string;
    value: Trip;
    indexes: { 'by-date': string };
  };
  packing_lists: {
    key: string;
    value: PackingItem[];
  };
  meals: {
    key: string;
    value: Meal[];
  };
  gear: {
    key: string;
    value: GearItem;
    indexes: { 'by-category': string };
  };
  shopping_lists: {
    key: string;
    value: ShoppingItem[];
  };
}

const DB_NAME = 'planmyescape_db';
const DB_VERSION = 1;

let db: IDBPDatabase<PlanMyEscapeDB>;

export const initDB = async () => {
  db = await openDB<PlanMyEscapeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores
      const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
      tripStore.createIndex('by-date', 'startDate');

      db.createObjectStore('packing_lists', { keyPath: 'tripId' });
      db.createObjectStore('meals', { keyPath: 'tripId' });
      
      const gearStore = db.createObjectStore('gear', { keyPath: 'id' });
      gearStore.createIndex('by-category', 'category');
      
      db.createObjectStore('shopping_lists', { keyPath: 'tripId' });
    },
  });
  return db;
};

// Trip operations
export const getTripsFromDB = async (): Promise<Trip[]> => {
  await initDB();
  return db.getAll('trips');
};

export const saveTripToDB = async (trip: Trip): Promise<void> => {
  await initDB();
  await db.put('trips', trip);
};

export const deleteTripFromDB = async (tripId: string): Promise<void> => {
  await initDB();
  await db.delete('trips', tripId);
  // Clean up related data
  await db.delete('packing_lists', tripId);
  await db.delete('meals', tripId);
  await db.delete('shopping_lists', tripId);
};

// Packing list operations
export const getPackingListFromDB = async (tripId: string): Promise<PackingItem[]> => {
  await initDB();
  return (await db.get('packing_lists', tripId)) || [];
};

export const savePackingListToDB = async (tripId: string, items: PackingItem[]): Promise<void> => {
  await initDB();
  await db.put('packing_lists', items, tripId);
};

// Meal operations
export const getMealsFromDB = async (tripId: string): Promise<Meal[]> => {
  await initDB();
  return (await db.get('meals', tripId)) || [];
};

export const saveMealsToDB = async (tripId: string, meals: Meal[]): Promise<void> => {
  await initDB();
  await db.put('meals', meals, tripId);
};

// Gear operations
export const getGearFromDB = async (): Promise<GearItem[]> => {
  await initDB();
  return db.getAll('gear');
};

export const saveGearToDB = async (gear: GearItem): Promise<void> => {
  await initDB();
  await db.put('gear', gear);
};

export const deleteGearFromDB = async (gearId: string): Promise<void> => {
  await initDB();
  await db.delete('gear', gearId);
};

// Shopping list operations
export const getShoppingListFromDB = async (tripId: string): Promise<ShoppingItem[]> => {
  await initDB();
  return (await db.get('shopping_lists', tripId)) || [];
};

export const saveShoppingListToDB = async (tripId: string, items: ShoppingItem[]): Promise<void> => {
  await initDB();
  await db.put('shopping_lists', items, tripId);
};

export const addToShoppingListDB = async (tripId: string, newItems: ShoppingItem[]): Promise<void> => {
  await initDB();
  const currentList = await getShoppingListFromDB(tripId);
  const updatedList = [...currentList];

  newItems.forEach(newItem => {
    const existingIndex = updatedList.findIndex(item => item.sourceItemId === newItem.sourceItemId);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        quantity: updatedList[existingIndex].quantity + newItem.quantity
      };
    } else {
      updatedList.push(newItem);
    }
  });

  await saveShoppingListToDB(tripId, updatedList);
}; 