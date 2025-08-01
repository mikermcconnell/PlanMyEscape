import { supabase } from '../supabaseClient';
import { PackingItem, Meal, ShoppingItem, GearItem, TodoItem } from '../types';

/**
 * Comprehensive Supabase data service for cross-device persistence
 * Handles all user data operations (packing items, meals, shopping lists, gear)
 */
export class SupabaseDataService {
  
  // === PACKING ITEMS ===
  
  async getPackingItems(tripId: string): Promise<PackingItem[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return (data || []).map(this.mapPackingItemFromDB);
  }
  
  async savePackingItems(tripId: string, items: PackingItem[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    if (items.length === 0) {
      // If no items, delete all existing items for this trip
      const { error } = await supabase
        .from('packing_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    
    // Use upsert for atomic operation - this will insert new items and update existing ones
    const dbItems = items.map(item => this.mapPackingItemToDB(item, tripId, user.id));
    const { error } = await supabase
      .from('packing_items')
      .upsert(dbItems, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    // Remove items that are no longer in the current list
    const currentItemIds = items.map(item => item.id);
    if (currentItemIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('packing_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .not('id', 'in', currentItemIds);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapPackingItemFromDB(dbItem: any): PackingItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      quantity: dbItem.quantity || 1,
      isChecked: dbItem.is_checked || false,
      weight: dbItem.weight,
      isOwned: dbItem.is_owned || false,
      needsToBuy: dbItem.needs_to_buy || false,
      isPacked: dbItem.is_packed || false,
      required: dbItem.required || false,
      assignedGroupId: dbItem.assigned_group_id,
      isPersonal: dbItem.is_personal || false,
      packedByUserId: dbItem.packed_by_user_id,
      lastModifiedBy: dbItem.last_modified_by,
      lastModifiedAt: dbItem.last_modified_at,
      notes: dbItem.notes
    };
  }
  
  private mapPackingItemToDB(item: PackingItem, tripId: string, userId: string): any {
    return {
      id: item.id,
      trip_id: tripId,
      user_id: userId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      is_checked: item.isChecked,
      weight: item.weight,
      is_owned: item.isOwned,
      needs_to_buy: item.needsToBuy,
      is_packed: item.isPacked,
      required: item.required,
      assigned_group_id: item.assignedGroupId,
      is_personal: item.isPersonal,
      packed_by_user_id: item.packedByUserId,
      last_modified_by: item.lastModifiedBy,
      last_modified_at: item.lastModifiedAt,
      notes: item.notes
    };
  }
  
  // === MEALS ===
  
  async getMeals(tripId: string): Promise<Meal[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return (data || []).map(this.mapMealFromDB);
  }
  
  async saveMeals(tripId: string, meals: Meal[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    if (meals.length === 0) {
      // If no meals, delete all existing meals for this trip
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    
    // Use upsert for atomic operation
    const dbMeals = meals.map(meal => this.mapMealToDB(meal, tripId, user.id));
    const { error } = await supabase
      .from('meals')
      .upsert(dbMeals, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    // Remove meals that are no longer in the current list
    const currentMealIds = meals.map(meal => meal.id);
    if (currentMealIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .not('id', 'in', currentMealIds);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapMealFromDB(dbMeal: any): Meal {
    return {
      id: dbMeal.id,
      name: dbMeal.name,
      day: dbMeal.day,
      type: dbMeal.type,
      ingredients: dbMeal.ingredients || [],
      isCustom: dbMeal.is_custom,
      assignedGroupId: dbMeal.assigned_group_id,
      sharedServings: dbMeal.shared_servings,
      servings: dbMeal.servings,
      lastModifiedBy: dbMeal.last_modified_by,
      lastModifiedAt: dbMeal.last_modified_at
    };
  }
  
  private mapMealToDB(meal: Meal, tripId: string, userId: string): any {
    return {
      id: meal.id,
      trip_id: tripId,
      user_id: userId,
      name: meal.name,
      day: meal.day,
      type: meal.type,
      ingredients: meal.ingredients,
      is_custom: meal.isCustom,
      assigned_group_id: meal.assignedGroupId,
      shared_servings: meal.sharedServings,
      servings: meal.servings,
      last_modified_by: meal.lastModifiedBy,
      last_modified_at: meal.lastModifiedAt
    };
  }
  
  // === SHOPPING LISTS ===
  
  async getShoppingItems(tripId: string): Promise<ShoppingItem[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return (data || []).map(this.mapShoppingItemFromDB);
  }
  
  async saveShoppingItems(tripId: string, items: ShoppingItem[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    if (items.length === 0) {
      // If no items, delete all existing shopping items for this trip
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    
    // Use upsert for atomic operation
    const dbItems = items.map(item => this.mapShoppingItemToDB(item, tripId, user.id));
    const { error } = await supabase
      .from('shopping_items')
      .upsert(dbItems, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    // Remove items that are no longer in the current list
    const currentItemIds = items.map(item => item.id);
    if (currentItemIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('shopping_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .not('id', 'in', currentItemIds);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapShoppingItemFromDB(dbItem: any): ShoppingItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      quantity: dbItem.quantity || 1,
      category: dbItem.category,
      isChecked: dbItem.is_checked,
      isOwned: dbItem.is_owned,
      needsToBuy: dbItem.needs_to_buy,
      sourceItemId: dbItem.source_item_id,
      assignedGroupId: dbItem.assigned_group_id,
      cost: dbItem.cost,
      paidByGroupId: dbItem.paid_by_group_id,
      paidByUserName: dbItem.paid_by_user_name,
      splits: dbItem.splits || []
    };
  }
  
  private mapShoppingItemToDB(item: ShoppingItem, tripId: string, userId: string): any {
    return {
      id: item.id,
      trip_id: tripId,
      user_id: userId,
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      is_checked: item.isChecked,
      is_owned: item.isOwned,
      needs_to_buy: item.needsToBuy,
      source_item_id: item.sourceItemId,
      assigned_group_id: item.assignedGroupId,
      cost: item.cost,
      paid_by_group_id: item.paidByGroupId,
      paid_by_user_name: item.paidByUserName,
      splits: item.splits
    };
  }
  
  // === GEAR ITEMS ===
  
  async getGearItems(): Promise<GearItem[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('gear_items')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    return (data || []).map(this.mapGearItemFromDB);
  }
  
  async saveGearItems(items: GearItem[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    if (items.length === 0) {
      // If no items, delete all existing gear items for this user
      const { error } = await supabase
        .from('gear_items')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    
    // Use upsert for atomic operation
    const dbItems = items.map(item => this.mapGearItemToDB(item, user.id));
    const { error } = await supabase
      .from('gear_items')
      .upsert(dbItems, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    // Remove items that are no longer in the current list
    const currentItemIds = items.map(item => item.id);
    if (currentItemIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('gear_items')
        .delete()
        .eq('user_id', user.id)
        .not('id', 'in', currentItemIds);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapGearItemFromDB(dbItem: any): GearItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      weight: dbItem.weight,
      notes: dbItem.notes,
      assignedTrips: dbItem.assigned_trips || []
    };
  }
  
  private mapGearItemToDB(item: GearItem, userId: string): any {
    return {
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      weight: item.weight,
      notes: item.notes,
      assigned_trips: item.assignedTrips
    };
  }
  
  // === DELETED INGREDIENTS TRACKING ===
  
  async getDeletedIngredients(tripId: string): Promise<string[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('deleted_ingredients')
      .select('ingredient_name')
      .eq('trip_id', tripId)
      .eq('user_id', user.id);
    
    if (error) throw error;
    return (data || []).map((row: any) => row.ingredient_name);
  }
  
  async saveDeletedIngredients(tripId: string, ingredientNames: string[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    if (ingredientNames.length === 0) {
      // If no deleted ingredients, remove all existing ones for this trip
      const { error } = await supabase
        .from('deleted_ingredients')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    
    // Use upsert for atomic operation (with unique constraint on trip_id, user_id, ingredient_name)
    const dbRows = ingredientNames.map(name => ({
      id: crypto.randomUUID(), // Generate ID for upsert
      trip_id: tripId,
      user_id: user.id,
      ingredient_name: name
    }));
    
    // First, delete existing deleted ingredients for this trip
    const { error: deleteError } = await supabase
      .from('deleted_ingredients')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', user.id);
    
    if (deleteError) throw deleteError;
    
    // Then insert the new ones
    const { error } = await supabase
      .from('deleted_ingredients')
      .insert(dbRows);
    
    if (error) throw error;
  }

  // === TODO ITEMS ===
  
  async getTodoItems(tripId: string): Promise<TodoItem[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(this.mapTodoItemFromDB);
  }
  
  async saveTodoItems(tripId: string, items: TodoItem[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    if (items.length === 0) {
      // If no items, delete all existing todo items for this trip
      const { error } = await supabase
        .from('todo_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    
    // Use upsert for atomic operation
    const dbItems = items.map(item => this.mapTodoItemToDB(item, tripId, user.id));
    const { error } = await supabase
      .from('todo_items')
      .upsert(dbItems, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    
    // Remove items that are no longer in the current list
    const currentItemIds = items.map(item => item.id);
    if (currentItemIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('todo_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .not('id', 'in', currentItemIds);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapTodoItemFromDB(dbItem: any): TodoItem {
    return {
      id: dbItem.id,
      text: dbItem.text,
      isCompleted: dbItem.is_completed || false,
      createdAt: dbItem.created_at,
      updatedAt: dbItem.updated_at,
      displayOrder: dbItem.display_order || 0
    };
  }
  
  private mapTodoItemToDB(item: TodoItem, tripId: string, userId: string): any {
    return {
      id: item.id,
      trip_id: tripId,
      user_id: userId,
      text: item.text,
      is_completed: item.isCompleted,
      display_order: item.displayOrder,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    };
  }
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService();