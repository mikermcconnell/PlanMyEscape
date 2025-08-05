import { supabaseDataService } from './supabaseDataService';
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
  saveTodoItems as saveTodoItemsLocal
} from '../utils/storage';
import { supabase } from '../supabaseClient';
import { PackingItem, Meal, ShoppingItem, GearItem, TodoItem } from '../types';

/**
 * Hybrid data service that tries Supabase first, falls back to local storage
 * Handles data migration from local to Supabase when user signs in
 */
export class HybridDataService {
  
  private async isSignedIn(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getUser();
      const signedIn = !error && !!data.user;
      console.log(`🔐 [HybridDataService] Auth check - Signed in: ${signedIn}, User ID: ${data.user?.id || 'none'}`);
      return signedIn;
    } catch (authError) {
      console.error('❌ [HybridDataService] Auth check failed:', authError);
      return false;
    }
  }
  
  // === PACKING ITEMS ===
  
  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    console.log(`🎒 [HybridDataService] Getting packing items for trip ${tripId}`);
    
    if (await this.isSignedIn()) {
      try {
        const items = await supabaseDataService.getPackingItems(tripId);
        console.log(`📦 [HybridDataService] Loaded ${items.length} packing items from Supabase`);
        
        // Safety check: Remove any duplicates that might exist in storage
        const uniqueItems = this.removeDuplicatePackingItems(items);
        if (uniqueItems.length !== items.length) {
          console.warn(`⚠️ [HybridDataService] Found ${items.length - uniqueItems.length} duplicate items in storage, cleaning up...`);
          // Save the cleaned version back to storage (bypass duplicate check to prevent loop)
          await this.savePackingItemsInternal(tripId, uniqueItems);
          return uniqueItems;
        }
        
        return items;
      } catch (error) {
        console.error('Failed to get packing items from Supabase, falling back to local:', error);
        const localItems = await getPackingListLocal(tripId);
        return this.removeDuplicatePackingItems(localItems);
      }
    }
    
    const localItems = await getPackingListLocal(tripId);
    console.log(`📱 [HybridDataService] Loaded ${localItems.length} packing items from local storage`);
    return this.removeDuplicatePackingItems(localItems);
  }
  
  async savePackingItems(tripId: string, items: PackingItem[]): Promise<void> {
    console.log(`🎒 [HybridDataService] Saving ${items.length} packing items for trip ${tripId}`);
    
    // DUPLICATE PREVENTION: Check for obvious duplicates before saving
    const uniqueItems = this.removeDuplicatePackingItems(items);
    if (uniqueItems.length !== items.length) {
      console.warn(`⚠️ [HybridDataService] Removed ${items.length - uniqueItems.length} duplicate packing items before saving`);
    }
    
    return await this.savePackingItemsInternal(tripId, uniqueItems);
  }
  
  /**
   * Internal save method that bypasses duplicate checking (used for cleanup operations)
   */
  private async savePackingItemsInternal(tripId: string, items: PackingItem[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        console.log('📤 [HybridDataService] User signed in, saving to Supabase...');
        await supabaseDataService.savePackingItems(tripId, items);
        // Also save locally as backup
        await savePackingListLocal(tripId, items);
        console.log('✅ [HybridDataService] Packing items saved successfully to Supabase');
      } catch (error) {
        console.error('❌ [HybridDataService] Failed to save packing items to Supabase, saving locally:', error);
        await savePackingListLocal(tripId, items);
      }
    } else {
      console.log('📱 [HybridDataService] User not signed in, saving locally only');
      await savePackingListLocal(tripId, items);
    }
  }
  
  /**
   * Remove duplicate packing items based on name and category
   */
  private removeDuplicatePackingItems(items: PackingItem[]): PackingItem[] {
    const seen = new Map<string, PackingItem>();
    
    for (const item of items) {
      const key = `${item.name.toLowerCase().trim()}-${item.category.toLowerCase().trim()}-${item.isPersonal}`;
      
      if (!seen.has(key)) {
        seen.set(key, item);
      } else {
        // Keep the item with more user data (owned, packed, notes, etc.)
        const existing = seen.get(key)!;
        const hasMoreData = item.isOwned || item.isPacked || item.needsToBuy || item.notes || item.assignedGroupId;
        const existingHasMoreData = existing.isOwned || existing.isPacked || existing.needsToBuy || existing.notes || existing.assignedGroupId;
        
        if (hasMoreData && !existingHasMoreData) {
          seen.set(key, item);
        }
      }
    }
    
    return Array.from(seen.values());
  }
  
  // === MEALS ===
  
  async getMeals(tripId: string): Promise<Meal[]> {
    console.log(`🍽️ [HybridDataService] Getting meals for trip ${tripId}`);
    if (await this.isSignedIn()) {
      try {
        console.log('📤 [HybridDataService] User signed in, loading from Supabase...');
        const supabaseMeals = await supabaseDataService.getMeals(tripId);
        console.log(`✅ [HybridDataService] Loaded ${supabaseMeals.length} meals from Supabase`);
        return supabaseMeals;
      } catch (error) {
        console.error('❌ [HybridDataService] Failed to get meals from Supabase, falling back to local:', error);
        const localMeals = await getMealsLocal(tripId);
        console.log(`📱 [HybridDataService] Loaded ${localMeals.length} meals from local storage as fallback`);
        return localMeals;
      }
    }
    console.log('📱 [HybridDataService] User not signed in, loading from local storage only');
    const localMeals = await getMealsLocal(tripId);
    console.log(`📱 [HybridDataService] Loaded ${localMeals.length} meals from local storage`);
    return localMeals;
  }
  
  async saveMeals(tripId: string, meals: Meal[]): Promise<void> {
    console.log(`🔍 [HybridDataService] saveMeals called with tripId: ${tripId}, meals.length: ${meals.length}`);
    console.log(`🍽️ [HybridDataService] Saving ${meals.length} meals for trip ${tripId}`);
    
    const isSignedIn = await this.isSignedIn();
    console.log(`🔐 [HybridDataService] User signed in status: ${isSignedIn}`);
    
    if (isSignedIn) {
      try {
        console.log('📤 [HybridDataService] User signed in, calling supabaseDataService.saveMeals...');
        await supabaseDataService.saveMeals(tripId, meals);
        console.log('✅ [HybridDataService] supabaseDataService.saveMeals completed successfully');
        
        // Also save locally as backup
        console.log('💾 [HybridDataService] Saving locally as backup...');
        await saveMealsLocal(tripId, meals);
        console.log('✅ [HybridDataService] Meals saved successfully to Supabase and local backup');
      } catch (error) {
        console.error('❌ [HybridDataService] Failed to save meals to Supabase, saving locally:', error);
        await saveMealsLocal(tripId, meals);
        throw error; // Re-throw the error so the MealPlanner can handle it
      }
    } else {
      console.log('📱 [HybridDataService] User not signed in, saving locally only');
      await saveMealsLocal(tripId, meals);
    }
  }
  
  // === SHOPPING ITEMS ===
  
  async getShoppingItems(tripId: string): Promise<ShoppingItem[]> {
    if (await this.isSignedIn()) {
      try {
        const items = await supabaseDataService.getShoppingItems(tripId);
        // Ensure shopping list is automatically populated with packing and meal items
        return await this.ensureShoppingListPopulated(tripId, items);
      } catch (error) {
        console.error('Failed to get shopping items from Supabase, falling back to local:', error);
        const localItems = await getShoppingListLocal(tripId);
        return await this.ensureShoppingListPopulated(tripId, localItems);
      }
    }
    const localItems = await getShoppingListLocal(tripId);
    return await this.ensureShoppingListPopulated(tripId, localItems);
  }
  
  // New method that accepts meals to avoid database reload race conditions
  async getShoppingItemsWithMeals(tripId: string, currentMeals: Meal[]): Promise<ShoppingItem[]> {
    if (await this.isSignedIn()) {
      try {
        const items = await supabaseDataService.getShoppingItems(tripId);
        // Use provided meals instead of loading from database
        return await this.ensureShoppingListPopulatedWithMeals(tripId, items, currentMeals);
      } catch (error) {
        console.error('Failed to get shopping items from Supabase, falling back to local:', error);
        const localItems = await getShoppingListLocal(tripId);
        return await this.ensureShoppingListPopulatedWithMeals(tripId, localItems, currentMeals);
      }
    }
    const localItems = await getShoppingListLocal(tripId);
    return await this.ensureShoppingListPopulatedWithMeals(tripId, localItems, currentMeals);
  }
  
  private async ensureShoppingListPopulated(tripId: string, existingItems: ShoppingItem[]): Promise<ShoppingItem[]> {
    console.log(`🛒 [HybridDataService] Ensuring shopping list is populated for trip ${tripId}`);
    
    // Get packing items and meals to auto-populate shopping list
    const [packingItems, meals, deletedIngredients] = await Promise.all([
      this.getPackingItems(tripId),
      this.getMeals(tripId),
      this.getDeletedIngredients(tripId)
    ]);
    
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
    const ingredientCounts = meals.length > 0 
      ? meals.flatMap(m => m.ingredients).reduce<Record<string, number>>((acc, ing) => {
          const normalizedName = ing.toLowerCase().trim();
          if (!deletedIngredientsSet.has(normalizedName)) {
            acc[ing] = (acc[ing] || 0) + 1;
          }
          return acc;
        }, {})
      : {};
    
    console.log(`🍽️ [HybridDataService] Current meal ingredients:`, Object.keys(ingredientCounts));
    
    const mealShoppingItems: ShoppingItem[] = Object.entries(ingredientCounts)
      .map(([name, count]) => {
        const existing = existingItemsMap.get(name.toLowerCase());
        return existing || {
          id: crypto.randomUUID(),
          name,
          quantity: count,
          category: 'food' as const,
          isChecked: false,
          needsToBuy: true,
          isOwned: false,
          sourceItemId: undefined // No sourceItemId means it's from meals
        };
      });
    
    // 3. Get manually added items (items not from packing or current meals)
    // FIXED: Properly filter out orphaned meal ingredients
    const manualItems = existingItems.filter(item => {
      // Keep items that are not auto-generated from packing or meals
      const isFromPacking = item.sourceItemId && packingItems.some(p => p.id === item.sourceItemId);
      
      // For food items without sourceItemId, only keep them if they're currently in meals
      // This will remove orphaned ingredients from deleted meals
      const isFoodItemWithoutSource = !item.sourceItemId && item.category === 'food';
      const isCurrentlyInMeals = ingredientCounts[item.name];
      
      if (isFromPacking) {
        return false; // Will be handled by packing section
      }
      
      if (isFoodItemWithoutSource) {
        if (isCurrentlyInMeals) {
          return false; // Will be handled by meals section
        } else {
          // This is an orphaned ingredient from a deleted meal
          console.log(`🗑️ [HybridDataService] Removing orphaned meal ingredient: ${item.name}`);
          return false;
        }
      }
      
      // Keep camping items and other manually added items
      return true;
    });
    
    // 4. Combine all items
    const allItems = [...packingShoppingItems, ...mealShoppingItems, ...manualItems];
    
    console.log(`🛒 [HybridDataService] Shopping list populated: ${packingShoppingItems.length} packing + ${mealShoppingItems.length} meal + ${manualItems.length} manual = ${allItems.length} total`);
    
    // 5. Save the updated shopping list if it changed
    if (allItems.length !== existingItems.length || 
        !allItems.every(item => existingItems.some(existing => 
          existing.id === item.id && 
          existing.name === item.name && 
          existing.quantity === item.quantity
        ))) {
      console.log(`🛒 [HybridDataService] Shopping list changed, saving...`);
      await this.saveShoppingItems(tripId, allItems);
      return allItems;
    }
    
    return existingItems;
  }
  
  private async ensureShoppingListPopulatedWithMeals(tripId: string, existingItems: ShoppingItem[], currentMeals: Meal[]): Promise<ShoppingItem[]> {
    console.log(`🛒 [HybridDataService] Ensuring shopping list is populated for trip ${tripId} with provided meals`);
    
    // Get packing items and deleted ingredients (but use provided meals)
    const [packingItems, deletedIngredients] = await Promise.all([
      this.getPackingItems(tripId),
      this.getDeletedIngredients(tripId)
    ]);
    
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
    
    // 2. Add meal ingredients from provided meals (excluding deleted ones)
    const ingredientCounts = currentMeals.length > 0 
      ? currentMeals.flatMap(m => m.ingredients).reduce<Record<string, number>>((acc, ing) => {
          const normalizedName = ing.toLowerCase().trim();
          if (!deletedIngredientsSet.has(normalizedName)) {
            acc[ing] = (acc[ing] || 0) + 1;
          }
          return acc;
        }, {})
      : {};
    
    console.log(`🍽️ [HybridDataService] Using provided meal ingredients:`, Object.keys(ingredientCounts));
    
    const mealShoppingItems: ShoppingItem[] = Object.entries(ingredientCounts)
      .map(([name, count]) => {
        const existing = existingItemsMap.get(name.toLowerCase());
        return existing || {
          id: crypto.randomUUID(),
          name,
          quantity: count,
          category: 'food' as const,
          isChecked: false,
          needsToBuy: true,
          isOwned: false,
          sourceItemId: undefined // No sourceItemId means it's from meals
        };
      });
    
    // 3. Get manually added items (items not from packing or current meals)
    // FIXED: Properly filter out orphaned meal ingredients
    const manualItems = existingItems.filter(item => {
      // Keep items that are not auto-generated from packing or meals
      const isFromPacking = item.sourceItemId && packingItems.some(p => p.id === item.sourceItemId);
      
      // For food items without sourceItemId, only keep them if they're currently in meals
      // This will remove orphaned ingredients from deleted meals
      const isFoodItemWithoutSource = !item.sourceItemId && item.category === 'food';
      const isCurrentlyInMeals = ingredientCounts[item.name];
      
      if (isFromPacking) {
        return false; // Will be handled by packing section
      }
      
      if (isFoodItemWithoutSource) {
        if (isCurrentlyInMeals) {
          return false; // Will be handled by meals section
        } else {
          // This is an orphaned ingredient from a deleted meal
          console.log(`🗑️ [HybridDataService] Removing orphaned meal ingredient: ${item.name}`);
          return false;
        }
      }
      
      // Keep camping items and other manually added items
      return true;
    });
    
    // 4. Combine all items
    const allItems = [...packingShoppingItems, ...mealShoppingItems, ...manualItems];
    
    console.log(`🛒 [HybridDataService] Shopping list populated with provided meals: ${packingShoppingItems.length} packing + ${mealShoppingItems.length} meal + ${manualItems.length} manual = ${allItems.length} total`);
    
    // 5. Save the updated shopping list if it changed
    if (allItems.length !== existingItems.length || 
        !allItems.every(item => existingItems.some(existing => 
          existing.id === item.id && 
          existing.name === item.name && 
          existing.quantity === item.quantity
        ))) {
      console.log(`🛒 [HybridDataService] Shopping list changed, saving...`);
      await this.saveShoppingItems(tripId, allItems);
      return allItems;
    }
    
    return existingItems;
  }
  
  async saveShoppingItems(tripId: string, items: ShoppingItem[]): Promise<void> {
    console.log(`🛒 [HybridDataService] Saving ${items.length} shopping items for trip ${tripId}`);
    if (await this.isSignedIn()) {
      try {
        console.log('📤 [HybridDataService] User signed in, saving to Supabase...');
        await supabaseDataService.saveShoppingItems(tripId, items);
        // Also save locally as backup
        await saveShoppingListLocal(tripId, items);
        console.log('✅ [HybridDataService] Shopping items saved successfully to Supabase');
      } catch (error) {
        console.error('❌ [HybridDataService] Failed to save shopping items to Supabase, saving locally:', error);
        await saveShoppingListLocal(tripId, items);
      }
    } else {
      console.log('📱 [HybridDataService] User not signed in, saving locally only');
      await saveShoppingListLocal(tripId, items);
    }
  }
  
  // === GEAR ITEMS ===
  
  async getGearItems(): Promise<GearItem[]> {
    if (await this.isSignedIn()) {
      try {
        return await supabaseDataService.getGearItems();
      } catch (error) {
        console.error('Failed to get gear items from Supabase, falling back to local:', error);
        return []; // Return empty array as fallback since local gear storage may not exist
      }
    }
    return []; // Return empty array for local storage fallback
  }
  
  async saveGearItems(items: GearItem[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await supabaseDataService.saveGearItems(items);
      } catch (error) {
        console.error('Failed to save gear items to Supabase:', error);
        throw error;
      }
    } else {
      console.warn('Cannot save gear items: user not signed in');
    }
  }
  
  // === DELETED INGREDIENTS ===
  
  async getDeletedIngredients(tripId: string): Promise<string[]> {
    if (await this.isSignedIn()) {
      try {
        return await supabaseDataService.getDeletedIngredients(tripId);
      } catch (error) {
        console.error('Failed to get deleted ingredients from Supabase, falling back to local:', error);
        return await getDeletedIngredientsLocal(tripId);
      }
    }
    return await getDeletedIngredientsLocal(tripId);
  }
  
  async saveDeletedIngredients(tripId: string, ingredientNames: string[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await supabaseDataService.saveDeletedIngredients(tripId, ingredientNames);
        // Also save locally as backup
        await saveDeletedIngredientsLocal(tripId, ingredientNames);
      } catch (error) {
        console.error('Failed to save deleted ingredients to Supabase, saving locally:', error);
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
        return await supabaseDataService.getTodoItems(tripId);
      } catch (error) {
        console.error('Failed to get todo items from Supabase, falling back to local:', error);
        return await getTodoItemsLocal(tripId);
      }
    }
    return await getTodoItemsLocal(tripId);
  }
  
  async saveTodoItems(tripId: string, items: TodoItem[]): Promise<void> {
    console.log(`✅ [HybridDataService] Saving ${items.length} todo items for trip ${tripId}`);
    if (await this.isSignedIn()) {
      try {
        console.log('📤 [HybridDataService] User signed in, saving to Supabase...');
        await supabaseDataService.saveTodoItems(tripId, items);
        // Also save locally as backup
        await saveTodoItemsLocal(tripId, items);
        console.log('✅ [HybridDataService] Todo items saved successfully to Supabase');
      } catch (error) {
        console.error('❌ [HybridDataService] Failed to save todo items to Supabase, saving locally:', error);
        await saveTodoItemsLocal(tripId, items);
      }
    } else {
      console.log('📱 [HybridDataService] User not signed in, saving locally only');
      await saveTodoItemsLocal(tripId, items);
    }
  }
  
  // === DATA MIGRATION ===
  
  /**
   * Migrate local data to Supabase when user signs in
   * Should be called after successful authentication
   */
  async migrateLocalDataToSupabase(tripIds: string[]): Promise<void> {
    if (!(await this.isSignedIn())) {
      console.warn('Cannot migrate data: user not signed in');
      return;
    }
    
    console.log('Starting data migration to Supabase...');
    
    try {
      // Migrate each trip's data
      for (const tripId of tripIds) {
        // Migrate packing items
        const localPackingItems = await getPackingListLocal(tripId);
        if (localPackingItems.length > 0) {
          await supabaseDataService.savePackingItems(tripId, localPackingItems);
          console.log(`Migrated ${localPackingItems.length} packing items for trip ${tripId}`);
        }
        
        // Migrate meals
        const localMeals = await getMealsLocal(tripId);
        if (localMeals.length > 0) {
          await supabaseDataService.saveMeals(tripId, localMeals);
          console.log(`Migrated ${localMeals.length} meals for trip ${tripId}`);
        }
        
        // Migrate shopping items
        const localShoppingItems = await getShoppingListLocal(tripId);
        if (localShoppingItems.length > 0) {
          await supabaseDataService.saveShoppingItems(tripId, localShoppingItems);
          console.log(`Migrated ${localShoppingItems.length} shopping items for trip ${tripId}`);
        }
        
        // Migrate deleted ingredients
        const localDeletedIngredients = await getDeletedIngredientsLocal(tripId);
        if (localDeletedIngredients.length > 0) {
          await supabaseDataService.saveDeletedIngredients(tripId, localDeletedIngredients);
          console.log(`Migrated ${localDeletedIngredients.length} deleted ingredients for trip ${tripId}`);
        }
        
        // Migrate todo items
        const localTodoItems = await getTodoItemsLocal(tripId);
        if (localTodoItems.length > 0) {
          await supabaseDataService.saveTodoItems(tripId, localTodoItems);
          console.log(`Migrated ${localTodoItems.length} todo items for trip ${tripId}`);
        }
      }
      
      // Note: Gear items migration skipped - local gear storage may not exist
      console.log('Gear items migration skipped - not implemented in local storage');
      
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hybridDataService = new HybridDataService();