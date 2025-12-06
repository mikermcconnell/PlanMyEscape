import { db, auth } from '../firebaseConfig';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    writeBatch,
    Timestamp,
    getDoc,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { PackingItem, Meal, ShoppingItem, GearItem, TodoItem, PackingTemplate, MealTemplate, Note } from '../types';
import logger from '../utils/logger';

export class FirebaseDataService {

    // Firestore batch limit is 500 operations per batch
    private static readonly BATCH_SIZE = 450; // Use 450 to have some buffer

    /**
     * Execute batch operations in chunks to handle Firestore's 500 operation limit
     */
    private async executeBatchedOperations(
        deleteRefs: Array<{ ref: any }>,
        setOperations: Array<{ ref: any; data: any }>
    ): Promise<void> {
        const allOperations = [
            ...deleteRefs.map(op => ({ type: 'delete' as const, ...op })),
            ...setOperations.map(op => ({ type: 'set' as const, ...op }))
        ];

        // Process in chunks
        for (let i = 0; i < allOperations.length; i += FirebaseDataService.BATCH_SIZE) {
            const chunk = allOperations.slice(i, i + FirebaseDataService.BATCH_SIZE);
            const batch = writeBatch(db);

            for (const op of chunk) {
                if (op.type === 'delete') {
                    batch.delete(op.ref);
                } else {
                    batch.set(op.ref, op.data);
                }
            }

            await batch.commit();
            logger.log(`📦 [FirebaseDataService] Committed batch ${Math.floor(i / FirebaseDataService.BATCH_SIZE) + 1}/${Math.ceil(allOperations.length / FirebaseDataService.BATCH_SIZE)}`);
        }
    }

    // === PACKING ITEMS ===

    async getPackingItems(tripId: string): Promise<PackingItem[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        logger.log(`📥 [FirebaseDataService] LOADING from FIRESTORE for trip ${tripId}, user ${user.uid}`);

        const q = query(
            collection(db, 'packing_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: PackingItem[] = [];

        querySnapshot.forEach((doc) => {
            items.push(this.mapPackingItemFromDB(doc.data()));
        });

        return items;
    }

    subscribeToPackingItems(tripId: string, callback: (items: PackingItem[]) => void): Unsubscribe {
        const user = auth.currentUser;
        if (!user) {
            logger.warn('[FirebaseDataService] Cannot subscribe to packing items: User not signed in');
            return () => { };
        }

        const q = query(
            collection(db, 'packing_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        logger.log(`🎧 [FirebaseDataService] Subscribing to packing items for trip ${tripId}`);
        return onSnapshot(q, (snapshot) => {
            const items: PackingItem[] = [];
            snapshot.forEach((doc) => {
                items.push(this.mapPackingItemFromDB(doc.data()));
            });
            callback(items);
        }, (error) => {
            logger.error('[FirebaseDataService] Error in packing items subscription:', error);
        });
    }

    async savePackingItems(tripId: string, items: PackingItem[]): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        logger.log(`🎒 [FirebaseDataService] Saving ${items.length} packing items for user ${user.uid}, trip ${tripId}`);

        // 1. Get existing items to delete
        const q = query(
            collection(db, 'packing_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        // 2. Prepare delete operations
        const deleteRefs: Array<{ ref: any }> = [];
        querySnapshot.forEach((docSnapshot) => {
            deleteRefs.push({ ref: docSnapshot.ref });
        });

        // 3. Prepare set operations
        const setOperations: Array<{ ref: any; data: any }> = items.map((item) => {
            const dbItem = this.mapPackingItemToDB(item, tripId, user.uid);
            const docRef = doc(db, 'packing_items', dbItem.id);
            return { ref: docRef, data: dbItem };
        });

        // 4. Execute with chunking to handle >500 items
        await this.executeBatchedOperations(deleteRefs, setOperations);
        logger.log('✅ [FirebaseDataService] Packing items replaced successfully in FIRESTORE');
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
        return {
            id: item.id,
            trip_id: tripId,
            user_id: userId,
            name: item.name || '',
            category: item.category || 'Other',
            quantity: item.quantity || 1,
            weight: item.weight || null,
            is_owned: Boolean(item.isOwned),
            needs_to_buy: Boolean(item.needsToBuy),
            is_packed: Boolean(item.isPacked),
            required: Boolean(item.required),
            assigned_group_id: item.assignedGroupId || null,
            is_personal: Boolean(item.isPersonal),
            packed_by_user_id: item.packedByUserId || null,
            last_modified_by: userId,
            last_modified_at: now,
            notes: item.notes || null,
            created_at: now,
            updated_at: now
        };
    }

    // === MEALS ===

    async getMeals(tripId: string): Promise<Meal[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'meals'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const meals: Meal[] = [];
        querySnapshot.forEach((doc) => {
            meals.push(this.mapMealFromDB(doc.data()));
        });

        return meals;
    }

    subscribeToMeals(tripId: string, callback: (meals: Meal[]) => void): Unsubscribe {
        const user = auth.currentUser;
        if (!user) {
            logger.warn('[FirebaseDataService] Cannot subscribe to meals: User not signed in');
            return () => { };
        }

        const q = query(
            collection(db, 'meals'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        logger.log(`🎧 [FirebaseDataService] Subscribing to meals for trip ${tripId}`);
        return onSnapshot(q, (snapshot) => {
            const meals: Meal[] = [];
            snapshot.forEach((doc) => {
                meals.push(this.mapMealFromDB(doc.data()));
            });
            callback(meals);
        }, (error) => {
            logger.error('[FirebaseDataService] Error in meals subscription:', error);
        });
    }

    async saveMeals(tripId: string, meals: Meal[]): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        logger.log(`🍽️ [FirebaseDataService] Saving ${meals.length} meals for trip ${tripId}`);

        // Get existing meals to delete
        const q = query(
            collection(db, 'meals'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        const deleteRefs: Array<{ ref: any }> = [];
        querySnapshot.forEach((docSnapshot) => {
            deleteRefs.push({ ref: docSnapshot.ref });
        });

        const setOperations: Array<{ ref: any; data: any }> = meals.map((meal) => {
            const dbMeal = this.mapMealToDB(meal, tripId, user.uid);
            const docRef = doc(db, 'meals', dbMeal.id);
            return { ref: docRef, data: dbMeal };
        });

        await this.executeBatchedOperations(deleteRefs, setOperations);
        logger.log('✅ [FirebaseDataService] Meals saved successfully');
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
        const now = new Date().toISOString();
        return {
            id: meal.id,
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
            last_modified_by: userId,
            last_modified_at: now,
            created_at: now,
            updated_at: now
        };
    }

    // === SHOPPING LISTS ===

    async getShoppingItems(tripId: string): Promise<ShoppingItem[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'shopping_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: ShoppingItem[] = [];
        querySnapshot.forEach((doc) => {
            items.push(this.mapShoppingItemFromDB(doc.data()));
        });

        return items;
    }

    subscribeToShoppingItems(tripId: string, callback: (items: ShoppingItem[]) => void): Unsubscribe {
        const user = auth.currentUser;
        if (!user) {
            logger.warn('[FirebaseDataService] Cannot subscribe to shopping items: User not signed in');
            return () => { };
        }

        const q = query(
            collection(db, 'shopping_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        logger.log(`🎧 [FirebaseDataService] Subscribing to shopping items for trip ${tripId}`);
        return onSnapshot(q, (snapshot) => {
            const items: ShoppingItem[] = [];
            snapshot.forEach((doc) => {
                items.push(this.mapShoppingItemFromDB(doc.data()));
            });
            callback(items);
        }, (error) => {
            logger.error('[FirebaseDataService] Error in shopping items subscription:', error);
        });
    }

    async saveShoppingItems(tripId: string, items: ShoppingItem[]): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        logger.log(`🛒 [FirebaseDataService] Saving ${items.length} shopping items for trip ${tripId}`);

        const q = query(
            collection(db, 'shopping_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        const deleteRefs: Array<{ ref: any }> = [];
        querySnapshot.forEach((docSnapshot) => {
            deleteRefs.push({ ref: docSnapshot.ref });
        });

        const setOperations: Array<{ ref: any; data: any }> = items.map((item) => {
            const dbItem = this.mapShoppingItemToDB(item, tripId, user.uid);
            const docRef = doc(db, 'shopping_items', dbItem.id);
            return { ref: docRef, data: dbItem };
        });

        await this.executeBatchedOperations(deleteRefs, setOperations);
        logger.log('✅ [FirebaseDataService] Shopping items saved successfully');
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
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'gear_items'),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: GearItem[] = [];
        querySnapshot.forEach((doc) => {
            items.push(this.mapGearItemFromDB(doc.data()));
        });

        return items;
    }

    async saveGearItems(items: GearItem[]): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const batch = writeBatch(db);

        const q = query(
            collection(db, 'gear_items'),
            where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        items.forEach((item) => {
            const dbItem = this.mapGearItemToDB(item, user.uid);
            const docRef = doc(db, 'gear_items', dbItem.id);
            batch.set(docRef, dbItem);
        });

        await batch.commit();
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

    // === DELETED INGREDIENTS ===

    async getDeletedIngredients(tripId: string): Promise<string[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'deleted_ingredients'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: string[] = [];
        querySnapshot.forEach((doc) => {
            items.push(doc.data().ingredient_name);
        });

        return items;
    }

    async saveDeletedIngredients(tripId: string, ingredientNames: string[]): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        logger.log(`🗑️ [FirebaseDataService] Saving ${ingredientNames.length} deleted ingredients for trip ${tripId}`);

        const q = query(
            collection(db, 'deleted_ingredients'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        const deleteRefs: Array<{ ref: any }> = [];
        querySnapshot.forEach((docSnapshot) => {
            deleteRefs.push({ ref: docSnapshot.ref });
        });

        const setOperations: Array<{ ref: any; data: any }> = ingredientNames.map((name) => {
            const id = crypto.randomUUID();
            const docRef = doc(db, 'deleted_ingredients', id);
            return {
                ref: docRef,
                data: {
                    id,
                    trip_id: tripId,
                    user_id: user.uid,
                    ingredient_name: name
                }
            };
        });

        await this.executeBatchedOperations(deleteRefs, setOperations);
    }

    // === TODO ITEMS ===

    async getTodoItems(tripId: string): Promise<TodoItem[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'todo_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: TodoItem[] = [];
        querySnapshot.forEach((doc) => {
            items.push(this.mapTodoItemFromDB(doc.data()));
        });

        return items.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    subscribeToTodoItems(tripId: string, callback: (items: TodoItem[]) => void): Unsubscribe {
        const user = auth.currentUser;
        if (!user) {
            logger.warn('[FirebaseDataService] Cannot subscribe to todo items: User not signed in');
            return () => { };
        }

        const q = query(
            collection(db, 'todo_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );

        logger.log(`🎧 [FirebaseDataService] Subscribing to todo items for trip ${tripId}`);
        return onSnapshot(q, (snapshot) => {
            const items: TodoItem[] = [];
            snapshot.forEach((doc) => {
                items.push(this.mapTodoItemFromDB(doc.data()));
            });
            callback(items.sort((a, b) => a.displayOrder - b.displayOrder));
        }, (error) => {
            logger.error('[FirebaseDataService] Error in todo items subscription:', error);
        });
    }

    async saveTodoItems(tripId: string, items: TodoItem[]): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        logger.log(`✅ [FirebaseDataService] Saving ${items.length} todo items for trip ${tripId}`);

        const q = query(
            collection(db, 'todo_items'),
            where('trip_id', '==', tripId),
            where('user_id', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        const deleteRefs: Array<{ ref: any }> = [];
        querySnapshot.forEach((docSnapshot) => {
            deleteRefs.push({ ref: docSnapshot.ref });
        });

        const setOperations: Array<{ ref: any; data: any }> = items.map((item) => {
            const dbItem = this.mapTodoItemToDB(item, tripId, user.uid);
            const docRef = doc(db, 'todo_items', dbItem.id);
            return { ref: docRef, data: dbItem };
        });

        await this.executeBatchedOperations(deleteRefs, setOperations);
        logger.log('✅ [FirebaseDataService] Todo items saved successfully');
    }

    private mapTodoItemFromDB(dbItem: any): TodoItem {
        return {
            id: dbItem.id,
            text: dbItem.text,
            isCompleted: dbItem.is_completed || false,
            createdAt: dbItem.created_at,
            updatedAt: dbItem.updated_at,
            displayOrder: dbItem.display_order
        };
    }

    private mapTodoItemToDB(item: TodoItem, tripId: string, userId: string): any {
        return {
            id: item.id,
            trip_id: tripId,
            user_id: userId,
            text: item.text,
            is_completed: item.isCompleted,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            display_order: item.displayOrder
        };
    }

    // === TEMPLATES ===

    async getPackingTemplates(): Promise<PackingTemplate[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'packing_templates'),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: PackingTemplate[] = [];
        querySnapshot.forEach((doc) => {
            items.push(this.mapPackingTemplateFromDB(doc.data()));
        });

        return items;
    }

    async savePackingTemplate(template: PackingTemplate): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const dbTemplate = {
            id: template.id,
            user_id: user.uid,
            name: template.name,
            trip_type: template.tripType,
            items: JSON.stringify(template.items),
            created_at: template.createdAt
        };

        await setDoc(doc(db, 'packing_templates', template.id), dbTemplate);
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

    async getMealTemplates(): Promise<MealTemplate[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'meal_templates'),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: MealTemplate[] = [];
        querySnapshot.forEach((doc) => {
            items.push(this.mapMealTemplateFromDB(doc.data()));
        });

        return items;
    }

    async saveMealTemplate(template: MealTemplate): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const dbTemplate = {
            id: template.id,
            user_id: user.uid,
            name: template.name,
            trip_type: template.tripType,
            trip_duration: template.tripDuration,
            meals: JSON.stringify(template.meals),
            created_at: template.createdAt
        };

        await setDoc(doc(db, 'meal_templates', template.id), dbTemplate);
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
    // === NOTES ===

    async getNotes(): Promise<Note[]> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const q = query(
            collection(db, 'notes'),
            where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const items: Note[] = [];
        querySnapshot.forEach((doc) => {
            items.push(this.mapNoteFromDB(doc.data()));
        });

        return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    async saveNote(note: Note): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        const dbNote = this.mapNoteToDB(note, user.uid);
        await setDoc(doc(db, 'notes', note.id), dbNote);
    }

    async deleteNote(noteId: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');

        await deleteDoc(doc(db, 'notes', noteId));
    }

    private mapNoteFromDB(dbNote: any): Note {
        return {
            id: dbNote.id,
            title: dbNote.title,
            content: dbNote.content,
            created_at: dbNote.created_at,
            updated_at: dbNote.updated_at
        };
    }

    private mapNoteToDB(note: Note, userId: string): any {
        const now = new Date().toISOString();
        return {
            id: note.id,
            user_id: userId,
            title: note.title,
            content: note.content,
            created_at: note.created_at || now,
            updated_at: now
        };
    }
}

export const firebaseDataService = new FirebaseDataService();
