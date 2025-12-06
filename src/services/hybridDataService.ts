import { firebaseDataService } from './firebaseDataService';
import {
  getPackingList as getPackingListLocal,
  savePackingList as savePackingListLocal,
  getMeals as getMealsLocal,
  saveMeals as saveMealsLocal,
  getShoppingList as getShoppingListLocal,
  saveShoppingList as saveShoppingListLocal,
  getDeletedIngredients as getDeletedIngredientsLocal,
  saveDeletedIngredients as saveDeletedIngredientsLocal,
  getTodoItems as getTodoItemsLocal,
  saveTodoItems as saveTodoItemsLocal,
  getTrips as getTripsLocal
} from '../utils/storage';
import { auth } from '../firebaseConfig';
import { Trip, PackingItem, Meal, ShoppingItem, GearItem, TodoItem, PackingTemplate, MealTemplate } from '../types';
import { Unsubscribe } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Hybrid data service that tries Firebase first, falls back to local storage
 * Handles data migration from local to Firebase when user signs in
 * Implements ephemeral data collection for Google Play Console compliance
 */
export class HybridDataService {

  // Data retention periods (in days)
  private static readonly DATA_RETENTION_DAYS = 365; // Keep user data for 1 year
  private static readonly SECURITY_LOG_RETENTION_DAYS = 90; // Keep security logs for 90 days
  private static readonly TEMP_DATA_RETENTION_MINUTES = 30; // Clear temporary data after 30 minutes

  private async isSignedIn(): Promise<boolean> {
    const user = auth.currentUser;
    const signedIn = !!user;
    // Only log essential auth info, not detailed user data
    logger.log(`🔐 [HybridDataService] Auth check - Status: ${signedIn ? 'authenticated' : 'anonymous'}`);
    return signedIn;
  }

  /**
   * Clean up expired temporary data in memory
   * Called automatically to maintain ephemeral data collection
   */
  private cleanupTempData(): void {
    const now = Date.now();
    const cutoffTime = now - (HybridDataService.TEMP_DATA_RETENTION_MINUTES * 60 * 1000);

    // Clear any temporary data older than retention period
    // This ensures data is processed ephemerally
    const tempDataKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('temp_') || key.startsWith('cache_')
    );

    tempDataKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && data.timestamp < cutoffTime) {
            localStorage.removeItem(key);
            logger.log(`🧹 [HybridDataService] Cleaned expired temp data: ${key}`);
          }
        }
      } catch {
        // Remove corrupted temp data
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Initialize cleanup on service creation
   */
  constructor() {
    // Run cleanup on initialization
    this.cleanupTempData();

    // Schedule regular cleanup every 15 minutes
    setInterval(() => {
      this.cleanupTempData();
    }, 15 * 60 * 1000);
  }

  // === TRIP OPERATIONS ===

  async getTrip(tripId: string): Promise<Trip | null> {
    logger.log(`🏕️ [HybridDataService] Getting trip ${tripId}`);

    if (await this.isSignedIn()) {
      try {
        // Import tripService dynamically to avoid circular dependency
        const { tripService } = await import('./tripService');
        const trip = await tripService.getTripById(tripId);
        logger.log(`✅ [HybridDataService] Loaded trip from Firebase: ${trip?.tripName || 'not found'}`);
        return trip;
      } catch (error) {
        logger.error('❌ [HybridDataService] Failed to get trip from Firebase, falling back to local:', error);
      }
    }

    // Fallback to local storage
    const trips = await getTripsLocal();
    const trip = trips.find(t => t.id === tripId) || null;
    logger.log(`📱 [HybridDataService] Loaded trip from local: ${trip?.tripName || 'not found'}`);
    return trip;
  }

  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
    logger.log(`🔄 [HybridDataService] Updating trip ${tripId}`);

    if (await this.isSignedIn()) {
      try {
        const { tripService } = await import('./tripService');
        const existingTrip = await tripService.getTripById(tripId);
        if (existingTrip) {
          const updatedTrip = { ...existingTrip, ...updates };
          await tripService.saveTrip(updatedTrip);
          logger.log('✅ [HybridDataService] Trip updated in Firebase');
        }
      } catch (error) {
        logger.error('❌ [HybridDataService] Failed to update trip in Firebase:', error);
        throw error;
      }
    } else {
      logger.warn('⚠️ [HybridDataService] Cannot update trip: user not signed in');
      throw new Error('User must be signed in to update trip');
    }
  }

  // === MIGRATION ===

  async migrateLocalDataToFirebase(tripIds: string[]): Promise<void> {
    if (!await this.isSignedIn()) {
      throw new Error('User must be signed in to migrate data');
    }

    logger.log(`🚀 [HybridDataService] Starting migration for ${tripIds.length} trips to Firebase`);

    for (const tripId of tripIds) {
      try {
        // 1. Packing Items
        const packingItems = await getPackingListLocal(tripId);
        if (packingItems.length > 0) {
          await firebaseDataService.savePackingItems(tripId, packingItems);
          logger.log(`✅ [HybridDataService] Migrated ${packingItems.length} packing items for trip ${tripId}`);
        }

        // 2. Meals
        const meals = await getMealsLocal(tripId);
        if (meals.length > 0) {
          await firebaseDataService.saveMeals(tripId, meals);
          logger.log(`✅ [HybridDataService] Migrated ${meals.length} meals for trip ${tripId}`);
        }

        // 3. Shopping Items
        const shoppingItems = await getShoppingListLocal(tripId);
        if (shoppingItems.length > 0) {
          await firebaseDataService.saveShoppingItems(tripId, shoppingItems);
          logger.log(`✅ [HybridDataService] Migrated ${shoppingItems.length} shopping items for trip ${tripId}`);
        }

        // 4. Deleted Ingredients
        const deletedIngredients = await getDeletedIngredientsLocal(tripId);
        if (deletedIngredients.length > 0) {
          await firebaseDataService.saveDeletedIngredients(tripId, deletedIngredients);
          logger.log(`✅ [HybridDataService] Migrated ${deletedIngredients.length} deleted ingredients for trip ${tripId}`);
        }

        // 5. Todo Items
        const todoItems = await getTodoItemsLocal(tripId);
        if (todoItems.length > 0) {
          await firebaseDataService.saveTodoItems(tripId, todoItems);
          logger.log(`✅ [HybridDataService] Migrated ${todoItems.length} todo items for trip ${tripId}`);
        }

      } catch (error) {
        logger.error(`❌ [HybridDataService] Failed to migrate trip ${tripId}:`, error);
        // Continue with other trips even if one fails
      }
    }
  }

  // === PACKING ITEMS ===

  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    logger.log(`🎒 [HybridDataService] Getting packing items for trip ${tripId}`);

    // Clean temp data before processing
    this.cleanupTempData();

    if (await this.isSignedIn()) {
      try {
        const items = await firebaseDataService.getPackingItems(tripId);
        logger.log(`📦 [HybridDataService] Loaded ${items.length} packing items from Firebase`);
        return items;
      } catch (error) {
        logger.error('Failed to get packing items from Firebase, using local fallback');
        const localItems = await getPackingListLocal(tripId);
        return localItems;
      }
    }

    const localItems = await getPackingListLocal(tripId);
    logger.log(`📱 [HybridDataService] Loaded ${localItems.length} items from local storage`);
    return localItems;
  }

  subscribeToPackingItems(tripId: string, callback: (items: PackingItem[]) => void): Unsubscribe {
    if (auth.currentUser) {
      logger.log(`🎧 [HybridDataService] Delegating subscription to Firebase for trip ${tripId}`);
      return firebaseDataService.subscribeToPackingItems(tripId, async (items) => {
        // Also save to local storage for offline backup
        await savePackingListLocal(tripId, items);
        callback(items);
      });
    } else {
      logger.log('📱 [HybridDataService] User not signed in, loading local items once (no real-time updates)');
      getPackingListLocal(tripId).then(items => callback(items));
      return () => { }; // No-op unsubscribe
    }
  }

  async savePackingItems(tripId: string, items: PackingItem[]): Promise<void> {
    logger.log(`🎒 [HybridDataService] Saving ${items.length} packing items for trip ${tripId}`);

    if (await this.isSignedIn()) {
      try {
        logger.log('📤 [HybridDataService] User signed in, saving to Firebase...');
        await firebaseDataService.savePackingItems(tripId, items);

        // Also save locally as backup
        await savePackingListLocal(tripId, items);
        logger.log('✅ [HybridDataService] Packing items saved successfully to Firebase');
      } catch (error) {
        logger.error('❌ [HybridDataService] Failed to save packing items to Firebase, saving locally:', error);
        await savePackingListLocal(tripId, items);
      }
    } else {
      logger.log('📱 [HybridDataService] User not signed in, saving locally only');
      await savePackingListLocal(tripId, items);
    }
  }

  // === MEALS ===

  async getMeals(tripId: string): Promise<Meal[]> {
    logger.log(`🍽️ [HybridDataService] Getting meals for trip ${tripId}`);
    if (await this.isSignedIn()) {
      try {
        logger.log('📤 [HybridDataService] User signed in, loading from Firebase...');
        const firebaseMeals = await firebaseDataService.getMeals(tripId);
        logger.log(`✅ [HybridDataService] Loaded ${firebaseMeals.length} meals from Firebase`);
        return firebaseMeals;
      } catch (error) {
        logger.error('❌ [HybridDataService] Failed to get meals from Firebase, falling back to local:', error);
        const localMeals = await getMealsLocal(tripId);
        logger.log(`📱 [HybridDataService] Loaded ${localMeals.length} meals from local storage as fallback`);
        return localMeals;
      }
    }
    logger.log('📱 [HybridDataService] User not signed in, loading from local storage only');
    const localMeals = await getMealsLocal(tripId);
    logger.log(`📱 [HybridDataService] Loaded ${localMeals.length} meals from local storage`);
    return localMeals;
  }

  subscribeToMeals(tripId: string, callback: (meals: Meal[]) => void): Unsubscribe {
    if (auth.currentUser) {
      logger.log(`🎧 [HybridDataService] Delegating subscription to Firebase for meals trip ${tripId}`);
      return firebaseDataService.subscribeToMeals(tripId, async (meals) => {
        await saveMealsLocal(tripId, meals);
        callback(meals);
      });
    } else {
      logger.log('📱 [HybridDataService] User not signed in, loading local meals once');
      getMealsLocal(tripId).then(meals => callback(meals));
      return () => { };
    }
  }

  async saveMeals(tripId: string, meals: Meal[]): Promise<void> {
    logger.log(`🔍 [HybridDataService] saveMeals called with tripId: ${tripId}, meals.length: ${meals.length}`);
    logger.log(`🍽️ [HybridDataService] Saving ${meals.length} meals for trip ${tripId}`);

    const isSignedIn = await this.isSignedIn();
    logger.log(`🔐 [HybridDataService] User signed in status: ${isSignedIn}`);

    if (isSignedIn) {
      try {
        logger.log('📤 [HybridDataService] User signed in, calling firebaseDataService.saveMeals...');
        await firebaseDataService.saveMeals(tripId, meals);
        logger.log('✅ [HybridDataService] firebaseDataService.saveMeals completed successfully');

        // Also save locally as backup
        logger.log('💾 [HybridDataService] Saving locally as backup...');
        await saveMealsLocal(tripId, meals);
        logger.log('✅ [HybridDataService] Meals saved successfully to Firebase and local backup');
      } catch (error) {
        logger.error('❌ [HybridDataService] Failed to save meals to Firebase, saving locally:', error);
        await saveMealsLocal(tripId, meals);
        logger.warn('⚠️ [HybridDataService] Firebase save failed; meals saved locally only');
        return;
      }
    } else {
      logger.log('📱 [HybridDataService] User not signed in, saving locally only');
      await saveMealsLocal(tripId, meals);
    }
  }

  // === SHOPPING ITEMS ===

  async getShoppingItems(tripId: string): Promise<ShoppingItem[]> {
    if (await this.isSignedIn()) {
      try {
        const items = await firebaseDataService.getShoppingItems(tripId);
        // Ensure shopping list is automatically populated with packing and meal items
        return await this.ensureShoppingListPopulated(tripId, items);
      } catch (error) {
        logger.error('Failed to get shopping items from Firebase, falling back to local:', error);
        const localItems = await getShoppingListLocal(tripId);
        return await this.ensureShoppingListPopulated(tripId, localItems);
      }
    }
    const localItems = await getShoppingListLocal(tripId);
    return await this.ensureShoppingListPopulated(tripId, localItems);
  }

  subscribeToShoppingItems(tripId: string, callback: (items: ShoppingItem[]) => void): Unsubscribe {
    if (auth.currentUser) {
      logger.log(`🎧 [HybridDataService] Delegating subscription to Firebase for shopping items trip ${tripId}`);
      return firebaseDataService.subscribeToShoppingItems(tripId, async (items) => {
        const populatedItems = await this.ensureShoppingListPopulated(tripId, items);
        await saveShoppingListLocal(tripId, populatedItems);
        callback(populatedItems);
      });
    } else {
      logger.log('📱 [HybridDataService] User not signed in, loading local shopping items once');
      getShoppingListLocal(tripId).then(async items => {
        const populated = await this.ensureShoppingListPopulated(tripId, items);
        callback(populated);
      });
      return () => { };
    }
  }

  // New method that accepts meals to avoid database reload race conditions
  async getShoppingItemsWithMeals(tripId: string, currentMeals: Meal[]): Promise<ShoppingItem[]> {
    if (await this.isSignedIn()) {
      try {
        const items = await firebaseDataService.getShoppingItems(tripId);
        // Use provided meals instead of loading from database
        return await this.ensureShoppingListPopulatedWithMeals(tripId, items, currentMeals);
      } catch (error) {
        logger.error('Failed to get shopping items from Firebase, falling back to local:', error);
        const localItems = await getShoppingListLocal(tripId);
        return await this.ensureShoppingListPopulatedWithMeals(tripId, localItems, currentMeals);
      }
    }
    const localItems = await getShoppingListLocal(tripId);
    return await this.ensureShoppingListPopulatedWithMeals(tripId, localItems, currentMeals);
  }

  private async ensureShoppingListPopulated(tripId: string, existingItems: ShoppingItem[]): Promise<ShoppingItem[]> {
    // Get packing items and meals to auto-populate shopping list
    const [packingItems, meals, deletedIngredients] = await Promise.all([
      this.getPackingItems(tripId),
      this.getMeals(tripId),
      this.getDeletedIngredients(tripId)
    ]);

    return this.populateShoppingListLogic(tripId, existingItems, packingItems, meals, deletedIngredients);
  }

  private async ensureShoppingListPopulatedWithMeals(tripId: string, existingItems: ShoppingItem[], currentMeals: Meal[]): Promise<ShoppingItem[]> {
    // Get packing items and deleted ingredients (but use provided meals)
    const [packingItems, deletedIngredients] = await Promise.all([
      this.getPackingItems(tripId),
      this.getDeletedIngredients(tripId)
    ]);

    return this.populateShoppingListLogic(tripId, existingItems, packingItems, currentMeals, deletedIngredients);
  }

  private async populateShoppingListLogic(
    tripId: string,
    existingItems: ShoppingItem[],
    packingItems: PackingItem[],
    meals: Meal[],
    deletedIngredients: string[]
  ): Promise<ShoppingItem[]> {

    const existingItemsMap = new Map(existingItems.map(item => [item.name.toLowerCase(), item]));
    const deletedIngredientsSet = new Set(deletedIngredients.map(name => name.toLowerCase()));

    // 1. Add packing items marked as needsToBuy
    const packingShoppingItems: ShoppingItem[] = packingItems
      .filter(item => item.needsToBuy && !item.isOwned)
      .map(item => {
        const existing = existingItemsMap.get(item.name.toLowerCase());
        return existing || {
          id: crypto.randomUUID(),
          name: item.name,
          quantity: item.quantity,
          category: 'camping' as const,
          isChecked: false,
          needsToBuy: true,
          isOwned: false,
          sourceItemId: item.id // Link back to packing item
        };
      });

    // 2. Add meal ingredients (excluding deleted ones)
    const ingredientInfo = meals.length > 0
      ? meals.flatMap(m => m.ingredients.map(ing => ({ ingredient: ing, groupId: m.assignedGroupId })))
        .reduce<Record<string, { count: number, groupId?: string }>>((acc, { ingredient, groupId }) => {
          const normalizedName = ingredient.toLowerCase().trim();
          if (!deletedIngredientsSet.has(normalizedName)) {
            if (!acc[ingredient]) {
              acc[ingredient] = { count: 0, groupId };
            }
            acc[ingredient]!.count += 1;
            if (acc[ingredient]!.groupId !== groupId) {
              acc[ingredient]!.groupId = undefined;
            }
          }
          return acc;
        }, {})
      : {};

    const mealShoppingItems: ShoppingItem[] = Object.entries(ingredientInfo)
      .map(([name, info]) => {
        const existing = existingItemsMap.get(name.toLowerCase());
        if (existing) {
          return { ...existing, assignedGroupId: info.groupId };
        }
        return {
          id: crypto.randomUUID(),
          name,
          quantity: info.count,
          category: 'food' as const,
          isChecked: false,
          needsToBuy: true,
          isOwned: false,
          sourceItemId: undefined,
          assignedGroupId: info.groupId
        };
      });

    // 3. Get manually added items
    const manualItems = existingItems.filter(item => {
      const isFromPacking = item.sourceItemId && packingItems.some(p => p.id === item.sourceItemId);
      const isFoodItemWithoutSource = !item.sourceItemId && item.category === 'food';
      const isCurrentlyInMeals = ingredientInfo[item.name];

      if (isFromPacking) return false;
      if (isFoodItemWithoutSource) {
        if (isCurrentlyInMeals) return false;
        else return false; // Orphaned ingredient
      }
      return true;
    });

    // 4. Combine all items
    const allItems = [...packingShoppingItems, ...mealShoppingItems, ...manualItems];

    // 5. Save if changed
    if (allItems.length !== existingItems.length ||
      !allItems.every(item => existingItems.some(existing =>
        existing.id === item.id &&
        existing.name === item.name &&
        existing.quantity === item.quantity &&
        existing.assignedGroupId === item.assignedGroupId
      ))) {
      logger.log(`🛒 [HybridDataService] Shopping list changed, saving...`);
      await this.saveShoppingItems(tripId, allItems);
      return allItems;
    }

    return existingItems;
  }

  async saveShoppingItems(tripId: string, items: ShoppingItem[]): Promise<void> {
    logger.log(`🛒 [HybridDataService] Saving ${items.length} shopping items for trip ${tripId}`);
    if (await this.isSignedIn()) {
      try {
        logger.log('📤 [HybridDataService] User signed in, saving to Firebase...');
        await firebaseDataService.saveShoppingItems(tripId, items);
        await saveShoppingListLocal(tripId, items);
        logger.log('✅ [HybridDataService] Shopping items saved successfully to Firebase');
      } catch (error) {
        logger.error('❌ [HybridDataService] Failed to save shopping items to Firebase, saving locally:', error);
        await saveShoppingListLocal(tripId, items);
      }
    } else {
      logger.log('📱 [HybridDataService] User not signed in, saving locally only');
      await saveShoppingListLocal(tripId, items);
    }
  }

  // === GEAR ITEMS ===

  async getGearItems(): Promise<GearItem[]> {
    if (await this.isSignedIn()) {
      try {
        return await firebaseDataService.getGearItems();
      } catch (error) {
        logger.error('Failed to get gear items from Firebase, falling back to local:', error);
        return [];
      }
    }
    return [];
  }

  async saveGearItems(items: GearItem[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await firebaseDataService.saveGearItems(items);
      } catch (error) {
        logger.error('Failed to save gear items to Firebase:', error);
        throw error;
      }
    } else {
      logger.warn('Cannot save gear items: user not signed in');
    }
  }

  // === DELETED INGREDIENTS ===

  async getDeletedIngredients(tripId: string): Promise<string[]> {
    if (await this.isSignedIn()) {
      try {
        return await firebaseDataService.getDeletedIngredients(tripId);
      } catch (error) {
        logger.error('Failed to get deleted ingredients from Firebase, falling back to local:', error);
        return await getDeletedIngredientsLocal(tripId);
      }
    }
    return await getDeletedIngredientsLocal(tripId);
  }

  async saveDeletedIngredients(tripId: string, ingredientNames: string[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await firebaseDataService.saveDeletedIngredients(tripId, ingredientNames);
        await saveDeletedIngredientsLocal(tripId, ingredientNames);
      } catch (error) {
        logger.error('Failed to save deleted ingredients to Firebase, saving locally:', error);
        await saveDeletedIngredientsLocal(tripId, ingredientNames);
      }
    } else {
      await saveDeletedIngredientsLocal(tripId, ingredientNames);
    }
  }

  // === TODO ITEMS ===

  async getTodoItems(tripId: string): Promise<TodoItem[]> {
    if (await this.isSignedIn()) {
      try {
        return await firebaseDataService.getTodoItems(tripId);
      } catch (error) {
        logger.error('Failed to get todo items from Firebase, falling back to local:', error);
        return await getTodoItemsLocal(tripId);
      }
    }
    return await getTodoItemsLocal(tripId);
  }

  subscribeToTodoItems(tripId: string, callback: (items: TodoItem[]) => void): Unsubscribe {
    if (auth.currentUser) {
      logger.log(`🎧 [HybridDataService] Delegating subscription to Firebase for todo items trip ${tripId}`);
      return firebaseDataService.subscribeToTodoItems(tripId, async (items) => {
        await saveTodoItemsLocal(tripId, items);
        callback(items);
      });
    } else {
      logger.log('📱 [HybridDataService] User not signed in, loading local todo items once');
      getTodoItemsLocal(tripId).then(items => callback(items));
      return () => { };
    }
  }

  async saveTodoItems(tripId: string, items: TodoItem[]): Promise<void> {
    logger.log(`✅ [HybridDataService] Saving ${items.length} todo items for trip ${tripId}`);
    if (await this.isSignedIn()) {
      try {
        logger.log('📤 [HybridDataService] User signed in, saving to Firebase...');
        await firebaseDataService.saveTodoItems(tripId, items);
        await saveTodoItemsLocal(tripId, items);
      } catch (error) {
        logger.error('Failed to save todo items to Firebase, saving locally:', error);
        await saveTodoItemsLocal(tripId, items);
      }
    } else {
      await saveTodoItemsLocal(tripId, items);
    }
  }

  // === TEMPLATES ===

  async getPackingTemplates(): Promise<PackingTemplate[]> {
    if (await this.isSignedIn()) {
      try {
        return await firebaseDataService.getPackingTemplates();
      } catch (error) {
        logger.error('Failed to get packing templates from Firebase:', error);
        return [];
      }
    }
    return [];
  }

  async savePackingTemplate(template: PackingTemplate): Promise<void> {
    if (await this.isSignedIn()) {
      await firebaseDataService.savePackingTemplate(template);
    }
  }

  async getMealTemplates(): Promise<MealTemplate[]> {
    if (await this.isSignedIn()) {
      try {
        return await firebaseDataService.getMealTemplates();
      } catch (error) {
        logger.error('Failed to get meal templates from Firebase:', error);
        return [];
      }
    }
    return [];
  }

  async saveMealTemplate(template: MealTemplate): Promise<void> {
    if (await this.isSignedIn()) {
      await firebaseDataService.saveMealTemplate(template);
    }
  }
}

export const hybridDataService = new HybridDataService();