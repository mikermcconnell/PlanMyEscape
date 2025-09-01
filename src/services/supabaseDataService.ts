import { supabase } from '../supabaseClient';
import { PackingItem, Meal, ShoppingItem, GearItem, TodoItem, PackingTemplate, MealTemplate } from '../types';

/**
 * Comprehensive Supabase data service for cross-device persistence
 * Handles all user data operations (packing items, meals, shopping lists, gear)
 */
export class SupabaseDataService {
  
  // === PACKING ITEMS ===
  
  // Helper function to validate UUID format
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
  
  // Convert legacy short ID to proper UUID (deterministic conversion)
  private legacyIdToUUID(legacyId: string): string {
    // Create a deterministic UUID from the legacy ID to maintain consistency
    // This ensures the same legacy ID always maps to the same UUID
    const hash = legacyId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    // Create a deterministic UUID v4 format using the hash
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const uuid = `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-8${hex.slice(4, 7)}-${hex}${hex.slice(0, 4)}`;
    return uuid;
  }
  
  // === TEMPLATE MANAGEMENT ===
  
  async getPackingTemplates(): Promise<PackingTemplate[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('packing_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(item => this.mapPackingTemplateFromDB(item));
  }
  
  async savePackingTemplate(template: PackingTemplate): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const dbTemplate = {
      id: template.id,
      user_id: user.id,
      name: template.name,
      trip_type: template.tripType,
      items: JSON.stringify(template.items),
      created_at: template.createdAt
    };
    
    const { error } = await supabase
      .from('packing_templates')
      .upsert(dbTemplate);
    
    if (error) throw error;
  }
  
  async getMealTemplates(): Promise<MealTemplate[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const { data, error } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(item => this.mapMealTemplateFromDB(item));
  }
  
  async saveMealTemplate(template: MealTemplate): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    const dbTemplate = {
      id: template.id,
      user_id: user.id,
      name: template.name,
      trip_type: template.tripType,
      trip_duration: template.tripDuration,
      meals: JSON.stringify(template.meals),
      created_at: template.createdAt
    };
    
    const { error } = await supabase
      .from('meal_templates')
      .upsert(dbTemplate);
    
    if (error) throw error;
  }
  
  private mapPackingTemplateFromDB(dbTemplate: any): PackingTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      tripType: dbTemplate.trip_type,
      items: JSON.parse(dbTemplate.items || '[]'),
      createdAt: dbTemplate.created_at,
      userId: dbTemplate.user_id
    };
  }
  
  private mapMealTemplateFromDB(dbTemplate: any): MealTemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      tripType: dbTemplate.trip_type,
      tripDuration: dbTemplate.trip_duration,
      meals: JSON.parse(dbTemplate.meals || '[]'),
      createdAt: dbTemplate.created_at,
      userId: dbTemplate.user_id
    };
  }
  
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
    return (data || []).map(item => this.mapPackingItemFromDB(item));
  }
  
  async savePackingItems(tripId: string, items: PackingItem[]): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ [SupabaseDataService] savePackingItems - User not authenticated:', userError?.message);
      throw new Error('Not signed in');
    }
    console.log(`🎒 [SupabaseDataService] Saving ${items.length} packing items for user ${user.id}, trip ${tripId}`);
    
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
    console.log(`📝 [SupabaseDataService] Mapped ${dbItems.length} items for database:`, dbItems[0] ? dbItems[0] : 'No items');
    
    const { error } = await supabase
      .from('packing_items')
      .upsert(dbItems, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ [SupabaseDataService] Failed to upsert packing items:', error);
      console.error('❌ [SupabaseDataService] Error details:', error.message, error.details, error.hint);
      console.error('❌ [SupabaseDataService] Attempted to save items:', dbItems);
      throw error;
    }
    console.log('✅ [SupabaseDataService] Packing items upsert successful');
    
    // Remove items that are no longer in the current list
    const currentItemIds = items.map(item => item.id);
    if (currentItemIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('packing_items')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .not('id', 'in', `(${currentItemIds.join(',')})`);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapPackingItemFromDB(dbItem: any): PackingItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      quantity: dbItem.quantity || 1,
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
    const now = new Date().toISOString();
    
    // Handle legacy short IDs by creating a UUID mapping
    let validId = item.id;
    if (!this.isValidUUID(item.id)) {
      // Create a deterministic UUID from the legacy ID to maintain consistency
      validId = this.legacyIdToUUID(item.id);
      console.log(`🔄 Converting legacy ID "${item.id}" to UUID "${validId}"`);
    }
    
    return {
      id: validId,
      trip_id: tripId,
      user_id: userId,
      name: item.name || '',
      category: item.category || 'Other', // Ensure category is never null
      quantity: item.quantity || 1,
      weight: item.weight || null,
      is_owned: Boolean(item.isOwned),
      needs_to_buy: Boolean(item.needsToBuy),
      is_packed: Boolean(item.isPacked),
      required: Boolean(item.required),
      assigned_group_id: item.assignedGroupId || null,
      is_personal: Boolean(item.isPersonal),
      packed_by_user_id: item.packedByUserId || null,
      last_modified_by: userId, // Always set to current user
      last_modified_at: now,
      notes: item.notes || null,
      created_at: now,
      updated_at: now
    };
  }
  
  // === MEALS ===
  
  async getMeals(tripId: string): Promise<Meal[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');
    
    console.log(`🍽️ [SupabaseDataService] Getting meals for trip ${tripId}, user ${user.id}`);
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id);
    
    if (error) {
      console.error(`❌ [SupabaseDataService] Get meals failed:`, error);
      throw error;
    }
    
    const meals = (data || []).map(item => this.mapMealFromDB(item));
    console.log(`📊 [SupabaseDataService] Retrieved ${meals.length} meals from database`);
    if (meals.length > 0 && meals[0]) {
      console.log(`🔍 [SupabaseDataService] First meal details:`, {
        id: meals[0].id,
        name: meals[0].name,
        day: meals[0].day,
        type: meals[0].type
      });
    }
    return meals;
  }
  
  async saveMeals(tripId: string, meals: Meal[]): Promise<void> {
    console.log(`🔍 [SupabaseDataService] saveMeals called with tripId: ${tripId}, meals.length: ${meals.length}`);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ [SupabaseDataService] saveMeals - User not authenticated:', userError?.message);
      throw new Error('Not signed in');
    }
    console.log(`🍽️ [SupabaseDataService] Saving ${meals.length} meals for user ${user.id}, trip ${tripId}`);
    
    if (meals.length === 0) {
      // If no meals, delete all existing meals for this trip
      console.log(`🗑️ [SupabaseDataService] Deleting ALL meals for trip ${tripId}, user ${user.id}`);
      
      // First, let's check what meals exist before deleting
      console.log(`🔍 [SupabaseDataService] Checking existing meals before delete...`);
      console.log(`🔍 [SupabaseDataService] Query parameters: tripId=${tripId}, userId=${user.id}`);
      
      // Check current authentication status
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error(`❌ [SupabaseDataService] Session check failed:`, sessionError);
      } else {
        console.log(`🔐 [SupabaseDataService] Session valid: ${!!sessionData.session}, Session user: ${sessionData.session?.user?.id}`);
      }
      
      const { data: existingMeals, error: checkError } = await supabase
        .from('meals')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
      
      if (checkError) {
        console.error(`❌ [SupabaseDataService] Failed to check existing meals:`, checkError);
      } else {
        console.log(`📊 [SupabaseDataService] Found ${existingMeals?.length || 0} existing meals to delete:`, existingMeals);
        if (existingMeals && existingMeals.length > 0) {
          console.log(`📊 [SupabaseDataService] Meal details:`, existingMeals.map(m => ({
            id: m.id,
            name: m.name,
            trip_id: m.trip_id,
            user_id: m.user_id,
            tripMatch: m.trip_id === tripId,
            userMatch: m.user_id === user.id
          })));
        }
      }
      
      // Now perform the delete - try bulk delete first
      console.log(`🗑️ [SupabaseDataService] Attempting bulk delete...`);
      const { error, count } = await supabase
        .from('meals')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
        
      if (error) {
        console.error(`❌ [SupabaseDataService] Bulk delete failed:`, error);
        console.error(`❌ [SupabaseDataService] Delete error details:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // If bulk delete failed and we have meals to delete, try individual deletes
        if (existingMeals && existingMeals.length > 0) {
          console.log(`🔄 [SupabaseDataService] Trying individual deletes for ${existingMeals.length} meals...`);
          let deleteCount = 0;
          for (const meal of existingMeals) {
            console.log(`🗑️ [SupabaseDataService] Deleting meal ${meal.id}: ${meal.name}`);
            const { error: individualError } = await supabase
              .from('meals')
              .delete()
              .eq('id', meal.id);
              
            if (individualError) {
              console.error(`❌ [SupabaseDataService] Failed to delete meal ${meal.id}:`, individualError);
            } else {
              deleteCount++;
              console.log(`✅ [SupabaseDataService] Successfully deleted meal ${meal.id}`);
            }
          }
          console.log(`📊 [SupabaseDataService] Individual delete results: ${deleteCount}/${existingMeals.length} successful`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ [SupabaseDataService] Bulk delete completed. Affected rows: ${count || 'unknown'}`);
      }
      
      // Verify the delete worked
      console.log(`🔍 [SupabaseDataService] Verifying delete was successful...`);
      const { data: remainingMeals, error: verifyError } = await supabase
        .from('meals')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user.id);
        
      if (verifyError) {
        console.error(`❌ [SupabaseDataService] Failed to verify delete:`, verifyError);
      } else {
        console.log(`📊 [SupabaseDataService] After delete verification: ${remainingMeals?.length || 0} meals remain:`, remainingMeals);
        if (remainingMeals && remainingMeals.length > 0) {
          console.error(`❌ [SupabaseDataService] DELETE FAILED - ${remainingMeals.length} meals still exist after delete operation!`);
          // Log details of remaining meals
          remainingMeals.forEach(meal => {
            console.error(`❌ [SupabaseDataService] Remaining meal: ${meal.id} - ${meal.name} (trip: ${meal.trip_id}, user: ${meal.user_id})`);
          });
        }
      }
      
      return;
    }
    
    // Use upsert for atomic operation
    const dbMeals = meals.map(meal => this.mapMealToDB(meal, tripId, user.id));
    console.log(`📝 [SupabaseDataService] Mapped ${dbMeals.length} meals for database:`, dbMeals[0] ? dbMeals[0] : 'No meals');
    
    const { error } = await supabase
      .from('meals')
      .upsert(dbMeals, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ [SupabaseDataService] Failed to upsert meals:', error);
      console.error('❌ [SupabaseDataService] Error details:', error.message, error.details, error.hint);
      console.error('❌ [SupabaseDataService] Attempted to save meals:', dbMeals);
      throw error;
    }
    console.log('✅ [SupabaseDataService] Meals upsert successful');
    
    // Remove meals that are no longer in the current list
    const currentMealIds = meals.map(meal => meal.id);
    console.log(`🗑️ [SupabaseDataService] Current meal IDs to keep: [${currentMealIds.join(', ')}]`);
    if (currentMealIds.length > 0) {
      const deleteFilter = `(${currentMealIds.join(',')})`;
      console.log(`🗑️ [SupabaseDataService] DELETE filter: not.in.${deleteFilter}`);
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .not('id', 'in', deleteFilter);
      
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
    // Handle legacy short IDs by creating a UUID mapping
    let validId = meal.id;
    if (!this.isValidUUID(meal.id)) {
      validId = this.legacyIdToUUID(meal.id);
      console.log(`🔄 Converting legacy meal ID "${meal.id}" to UUID "${validId}"`);
    }
    
    const now = new Date().toISOString();
    return {
      id: validId,
      trip_id: tripId,
      user_id: userId,
      name: meal.name || '',
      day: meal.day || 1,
      type: meal.type || 'dinner',
      ingredients: meal.ingredients || [],
      is_custom: Boolean(meal.isCustom),
      assigned_group_id: meal.assignedGroupId || null,
      shared_servings: meal.sharedServings !== undefined ? Boolean(meal.sharedServings) : true,
      servings: meal.servings || 1,
      last_modified_by: userId, // Always set to current user
      last_modified_at: now,
      created_at: now,
      updated_at: now
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
    return (data || []).map(item => this.mapShoppingItemFromDB(item));
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
        .not('id', 'in', `(${currentItemIds.join(',')})`);
      
      if (deleteError) throw deleteError;
    }
  }
  
  private mapShoppingItemFromDB(dbItem: any): ShoppingItem {
    return {
      id: dbItem.id,
      name: dbItem.name,
      quantity: dbItem.quantity || 1,
      category: dbItem.category,
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
    return (data || []).map(item => this.mapGearItemFromDB(item));
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
        .not('id', 'in', `(${currentItemIds.join(',')})`);
      
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
    return (data || []).map(item => this.mapTodoItemFromDB(item));
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
        .not('id', 'in', `(${currentItemIds.join(',')})`);
      
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