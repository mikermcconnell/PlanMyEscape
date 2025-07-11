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
// Incremented DB_VERSION to 2 to trigger migration that removes invalid keyPath definitions for
// stores that save raw arrays (packing_lists, meals, shopping_lists). Using a keyPath on an
// array value caused put() operations to fail silently, resulting in data loss between sessions.
const DB_VERSION = 2;

// Centralised upgrade callback – keeps store definition in one place
// Handles both fresh installs (oldVersion === 0) and migrations from v1 → v2.
// The v2 schema removes keyPath definitions from stores that persist raw arrays, allowing
// the caller to supply the key in put/get operations.
const upgrade = (
  db: IDBPDatabase<PlanMyEscapeDB>,
  oldVersion: number,
): void => {
  // v1 (oldVersion === 0) – fresh DB creation
  if (oldVersion < 1) {
  const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
  tripStore.createIndex('by-date', 'startDate');

    // These stores intentionally have NO keyPath – we supply the tripId manually
    db.createObjectStore('packing_lists');
    db.createObjectStore('meals');
  
  const gearStore = db.createObjectStore('gear', { keyPath: 'id' });
  gearStore.createIndex('by-category', 'category');
  
    db.createObjectStore('shopping_lists');
  }

  // v2 migration – remove mistaken keyPath from array stores created in v1
  if (oldVersion === 1) {
    // Remove the old mis-configured stores
    const storesToRecreate = ['packing_lists', 'meals', 'shopping_lists'] as const;
    storesToRecreate.forEach(storeName => {
      if (db.objectStoreNames.contains(storeName)) {
        db.deleteObjectStore(storeName);
      }
    });

    // Re-create them without a keyPath
    db.createObjectStore('packing_lists');
    db.createObjectStore('meals');
    db.createObjectStore('shopping_lists');
  }
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
  const database = await initDB();
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

  await database.put('shopping_lists', updatedList, tripId);
}; 