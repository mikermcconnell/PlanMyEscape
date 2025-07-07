import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';
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

// Centralised upgrade callback – keeps store definition in one place
const upgrade = (db: IDBPDatabase<PlanMyEscapeDB>) => {
  const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
  tripStore.createIndex('by-date', 'startDate');

  db.createObjectStore('packing_lists', { keyPath: 'tripId' });
  db.createObjectStore('meals', { keyPath: 'tripId' });
  
  const gearStore = db.createObjectStore('gear', { keyPath: 'id' });
  gearStore.createIndex('by-category', 'category');
  
  db.createObjectStore('shopping_lists', { keyPath: 'tripId' });
};

// Helper to report failures to Sentry / PostHog when available
const reportDBError = (error: unknown, stage: string) => {
  if (typeof window !== 'undefined') {
    const w = window as any;
    if (w.Sentry?.captureException) {
      w.Sentry.captureException(error, { tags: { stage, subsystem: 'indexeddb' } });
    }
    if (w.posthog?.capture) {
      w.posthog.capture('indexeddb_error', { stage, message: (error as Error)?.message || String(error) });
    }
  }
  console.error(`[IndexedDB] (${stage})`, error);
};

const MAX_RETRIES = 3;

let db: IDBPDatabase<PlanMyEscapeDB> | null = null;

const openWithRetry = async (): Promise<IDBPDatabase<PlanMyEscapeDB>> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await openDB<PlanMyEscapeDB>(DB_NAME, DB_VERSION, { upgrade });
    } catch (error) {
      reportDBError(error, `open_attempt_${attempt}`);

      // On final retry, assume corruption ➜ delete + fresh open
      if (attempt === MAX_RETRIES) {
        try {
          await deleteDB(DB_NAME);
          reportDBError(new Error('IndexedDB deleted for recovery'), 'corruption_recovery');
          return await openDB<PlanMyEscapeDB>(DB_NAME, DB_VERSION, { upgrade });
        } catch (recoveryError) {
          reportDBError(recoveryError, 'recovery_failed');
          throw recoveryError; // bubble up – app can handle / fallback
        }
      }
      // small delay before next retry to avoid tight loop
      await new Promise(res => setTimeout(res, 150 * attempt));
    }
  }
  throw new Error('Unable to initialise database');
};

export const initDB = async (): Promise<IDBPDatabase<PlanMyEscapeDB>> => {
  if (!db) {
    db = await openWithRetry();
  }
  return db;
};

// Trip operations
export const getTripsFromDB = async (): Promise<Trip[]> => {
  const db = await initDB();
  return db.getAll('trips');
};

export const saveTripToDB = async (trip: Trip): Promise<void> => {
  const db = await initDB();
  await db.put('trips', trip);
};

export const deleteTripFromDB = async (tripId: string): Promise<void> => {
  const db = await initDB();
  await db.delete('trips', tripId);
  // Clean up related data
  await db.delete('packing_lists', tripId);
  await db.delete('meals', tripId);
  await db.delete('shopping_lists', tripId);
};

// Packing list operations
export const getPackingListFromDB = async (tripId: string): Promise<PackingItem[]> => {
  const db = await initDB();
  return (await db.get('packing_lists', tripId)) || [];
};

export const savePackingListToDB = async (tripId: string, items: PackingItem[]): Promise<void> => {
  const db = await initDB();
  await db.put('packing_lists', items, tripId);
};

// Meal operations
export const getMealsFromDB = async (tripId: string): Promise<Meal[]> => {
  const db = await initDB();
  return (await db.get('meals', tripId)) || [];
};

export const saveMealsToDB = async (tripId: string, meals: Meal[]): Promise<void> => {
  const db = await initDB();
  await db.put('meals', meals, tripId);
};

// Gear operations
export const getGearFromDB = async (): Promise<GearItem[]> => {
  const db = await initDB();
  return db.getAll('gear');
};

export const saveGearToDB = async (gear: GearItem): Promise<void> => {
  const db = await initDB();
  await db.put('gear', gear);
};

export const deleteGearFromDB = async (gearId: string): Promise<void> => {
  const db = await initDB();
  await db.delete('gear', gearId);
};

// Shopping list operations
export const getShoppingListFromDB = async (tripId: string): Promise<ShoppingItem[]> => {
  const db = await initDB();
  return (await db.get('shopping_lists', tripId)) || [];
};

export const saveShoppingListToDB = async (tripId: string, items: ShoppingItem[]): Promise<void> => {
  const db = await initDB();
  await db.put('shopping_lists', items, tripId);
};

export const addToShoppingListDB = async (tripId: string, newItems: ShoppingItem[]): Promise<void> => {
  const db = await initDB();
  const currentList = await getShoppingListFromDB(tripId);
  const updatedList = [...currentList];

  newItems.forEach(rawItem => {
    const item: ShoppingItem = { ...rawItem, id: rawItem.id ?? crypto.randomUUID() } as ShoppingItem;

    const existingIndex = updatedList.findIndex(it => it.sourceItemId === item.sourceItemId);

    if (existingIndex >= 0) {
      const existing = updatedList[existingIndex]!;
      updatedList[existingIndex] = {
        ...existing,
        quantity: existing.quantity + item.quantity
      };
    } else {
      updatedList.push(item);
    }
  });

  await saveShoppingListToDB(tripId, updatedList);
}; 