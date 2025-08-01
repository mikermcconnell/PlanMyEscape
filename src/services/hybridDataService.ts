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
      return !error && !!data.user;
    } catch {
      return false;
    }
  }
  
  // === PACKING ITEMS ===
  
  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    if (await this.isSignedIn()) {
      try {
        return await supabaseDataService.getPackingItems(tripId);
      } catch (error) {
        console.error('Failed to get packing items from Supabase, falling back to local:', error);
        return await getPackingListLocal(tripId);
      }
    }
    return await getPackingListLocal(tripId);
  }
  
  async savePackingItems(tripId: string, items: PackingItem[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await supabaseDataService.savePackingItems(tripId, items);
        // Also save locally as backup
        await savePackingListLocal(tripId, items);
      } catch (error) {
        console.error('Failed to save packing items to Supabase, saving locally:', error);
        await savePackingListLocal(tripId, items);
      }
    } else {
      await savePackingListLocal(tripId, items);
    }
  }
  
  // === MEALS ===
  
  async getMeals(tripId: string): Promise<Meal[]> {
    if (await this.isSignedIn()) {
      try {
        return await supabaseDataService.getMeals(tripId);
      } catch (error) {
        console.error('Failed to get meals from Supabase, falling back to local:', error);
        return await getMealsLocal(tripId);
      }
    }
    return await getMealsLocal(tripId);
  }
  
  async saveMeals(tripId: string, meals: Meal[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await supabaseDataService.saveMeals(tripId, meals);
        // Also save locally as backup
        await saveMealsLocal(tripId, meals);
      } catch (error) {
        console.error('Failed to save meals to Supabase, saving locally:', error);
        await saveMealsLocal(tripId, meals);
      }
    } else {
      await saveMealsLocal(tripId, meals);
    }
  }
  
  // === SHOPPING ITEMS ===
  
  async getShoppingItems(tripId: string): Promise<ShoppingItem[]> {
    if (await this.isSignedIn()) {
      try {
        return await supabaseDataService.getShoppingItems(tripId);
      } catch (error) {
        console.error('Failed to get shopping items from Supabase, falling back to local:', error);
        return await getShoppingListLocal(tripId);
      }
    }
    return await getShoppingListLocal(tripId);
  }
  
  async saveShoppingItems(tripId: string, items: ShoppingItem[]): Promise<void> {
    if (await this.isSignedIn()) {
      try {
        await supabaseDataService.saveShoppingItems(tripId, items);
        // Also save locally as backup
        await saveShoppingListLocal(tripId, items);
      } catch (error) {
        console.error('Failed to save shopping items to Supabase, saving locally:', error);
        await saveShoppingListLocal(tripId, items);
      }
    } else {
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
    if (await this.isSignedIn()) {
      try {
        await supabaseDataService.saveTodoItems(tripId, items);
        // Also save locally as backup
        await saveTodoItemsLocal(tripId, items);
      } catch (error) {
        console.error('Failed to save todo items to Supabase, saving locally:', error);
        await saveTodoItemsLocal(tripId, items);
      }
    } else {
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