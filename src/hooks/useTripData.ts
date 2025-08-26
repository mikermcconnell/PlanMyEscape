import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trip, PackingItem, Meal, ShoppingItem, TodoItem } from '../types';
import { hybridDataService } from '../services/hybridDataService';
import { usePerformanceMonitor } from '../utils/performanceMonitor';
import { useDebouncedCallback } from './useDebounce';
import { useOfflineDetection } from './useOfflineDetection';

interface TripDataState {
  trip: Trip | null;
  packingItems: PackingItem[];
  meals: Meal[];
  shoppingItems: ShoppingItem[];
  todoItems: TodoItem[];
  loading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  stats?: {
    totalItems: number;
    packedItems: number;
    needToBuy: number;
    totalMeals: number;
    completedTodos: number;
    totalCost: number;
  };
}

interface TripDataActions {
  // Trip actions
  updateTrip: (updates: Partial<Trip>) => Promise<void>;
  
  // Packing actions
  addPackingItem: (item: Omit<PackingItem, 'id'>) => Promise<void>;
  updatePackingItem: (id: string, updates: Partial<PackingItem>) => Promise<void>;
  deletePackingItem: (id: string) => Promise<void>;
  
  // Meal actions
  addMeal: (meal: Omit<Meal, 'id'>) => Promise<void>;
  updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  
  // Shopping actions
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  syncShoppingList: () => Promise<void>;
  
  // Todo actions
  addTodoItem: (item: Omit<TodoItem, 'id'>) => Promise<void>;
  updateTodoItem: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodoItem: (id: string) => Promise<void>;
  
  // Sync actions
  syncAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTripData = (tripId: string): TripDataState & TripDataActions => {
  const [state, setState] = useState<TripDataState>({
    trip: null,
    packingItems: [],
    meals: [],
    shoppingItems: [],
    todoItems: [],
    loading: true,
    error: null,
    lastSyncTime: null
  });

  const { measure } = usePerformanceMonitor('TripData');
  const { isOffline } = useOfflineDetection();

  // Load all trip data
  const loadTripData = useCallback(async () => {
    if (!tripId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await measure('loadAllData', async () => {
        const [trip, packingItems, meals, shoppingItems, todoItems] = await Promise.all([
          hybridDataService.getTrip(tripId),
          hybridDataService.getPackingItems(tripId),
          hybridDataService.getMeals(tripId),
          hybridDataService.getShoppingItems(tripId),
          hybridDataService.getTodoItems(tripId)
        ]);

        setState({
          trip,
          packingItems,
          meals,
          shoppingItems,
          todoItems,
          loading: false,
          error: null,
          lastSyncTime: new Date()
        });
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load trip data'
      }));
    }
  }, [tripId, measure]);

  // Initial load
  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleSync = () => {
      if (!isOffline) {
        loadTripData();
      }
    };

    window.addEventListener('syncRequired', handleSync);
    return () => window.removeEventListener('syncRequired', handleSync);
  }, [isOffline, loadTripData]);

  // Optimistic update helper
  const optimisticUpdate = async <T,>(
    updateState: (prev: TripDataState) => TripDataState,
    saveOperation: () => Promise<T>,
    revertState?: (prev: TripDataState) => TripDataState
  ): Promise<T> => {
    // Optimistic update
    setState(updateState);

    try {
      // Persist to storage
      const result = await saveOperation();
      setState(prev => ({ ...prev, lastSyncTime: new Date() }));
      return result;
    } catch (error) {
      // Revert on failure
      if (revertState) {
        setState(revertState);
      } else {
        // Reload all data if no revert function provided
        await loadTripData();
      }
      throw error;
    }
  };

  // Trip actions
  const updateTrip = async (updates: Partial<Trip>) => {
    if (!state.trip) return;

    await optimisticUpdate(
      prev => ({
        ...prev,
        trip: { ...prev.trip!, ...updates }
      }),
      async () => {
        await hybridDataService.updateTrip(tripId, updates);
      }
    );
  };

  // Packing actions
  const addPackingItem = async (item: Omit<PackingItem, 'id'>) => {
    const newItem: PackingItem = {
      ...item,
      id: crypto.randomUUID()
    };

    await optimisticUpdate(
      prev => ({
        ...prev,
        packingItems: [...prev.packingItems, newItem]
      }),
      async () => {
        await hybridDataService.savePackingItems(tripId, [...state.packingItems, newItem]);
      }
    );
  };

  const updatePackingItem = async (id: string, updates: Partial<PackingItem>) => {
    await optimisticUpdate(
      prev => ({
        ...prev,
        packingItems: prev.packingItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      }),
      async () => {
        const updatedItems = state.packingItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        await hybridDataService.savePackingItems(tripId, updatedItems);
      }
    );
  };

  const deletePackingItem = async (id: string) => {
    const deletedItem = state.packingItems.find(item => item.id === id);
    
    await optimisticUpdate(
      prev => ({
        ...prev,
        packingItems: prev.packingItems.filter(item => item.id !== id)
      }),
      async () => {
        const updatedItems = state.packingItems.filter(item => item.id !== id);
        await hybridDataService.savePackingItems(tripId, updatedItems);
      },
      // Revert function
      prev => ({
        ...prev,
        packingItems: deletedItem 
          ? [...prev.packingItems, deletedItem].sort((a, b) => a.name.localeCompare(b.name))
          : prev.packingItems
      })
    );
  };

  // Meal actions
  const addMeal = async (meal: Omit<Meal, 'id'>) => {
    const newMeal: Meal = {
      ...meal,
      id: crypto.randomUUID()
    };

    await optimisticUpdate(
      prev => ({
        ...prev,
        meals: [...prev.meals, newMeal]
      }),
      async () => {
        await hybridDataService.saveMeals(tripId, [...state.meals, newMeal]);
      }
    );
  };

  const updateMeal = async (id: string, updates: Partial<Meal>) => {
    await optimisticUpdate(
      prev => ({
        ...prev,
        meals: prev.meals.map(meal =>
          meal.id === id ? { ...meal, ...updates } : meal
        )
      }),
      async () => {
        const updatedMeals = state.meals.map(meal =>
          meal.id === id ? { ...meal, ...updates } : meal
        );
        await hybridDataService.saveMeals(tripId, updatedMeals);
      }
    );
  };

  const deleteMeal = async (id: string) => {
    const deletedMeal = state.meals.find(meal => meal.id === id);
    
    await optimisticUpdate(
      prev => ({
        ...prev,
        meals: prev.meals.filter(meal => meal.id !== id)
      }),
      async () => {
        const updatedMeals = state.meals.filter(meal => meal.id !== id);
        await hybridDataService.saveMeals(tripId, updatedMeals);
      },
      // Revert function
      prev => ({
        ...prev,
        meals: deletedMeal
          ? [...prev.meals, deletedMeal].sort((a, b) => a.day - b.day)
          : prev.meals
      })
    );
  };

  // Shopping actions
  const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>) => {
    await optimisticUpdate(
      prev => ({
        ...prev,
        shoppingItems: prev.shoppingItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      }),
      async () => {
        const updatedItems = state.shoppingItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        await hybridDataService.saveShoppingItems(tripId, updatedItems);
      }
    );
  };

  const syncShoppingList = async () => {
    await measure('syncShoppingList', async () => {
      const items = await hybridDataService.getShoppingItemsWithMeals(tripId, state.meals);
      setState(prev => ({ ...prev, shoppingItems: items }));
    });
  };

  // Todo actions
  const addTodoItem = async (item: Omit<TodoItem, 'id'>) => {
    const newItem: TodoItem = {
      ...item,
      id: crypto.randomUUID()
    };

    await optimisticUpdate(
      prev => ({
        ...prev,
        todoItems: [...prev.todoItems, newItem]
      }),
      async () => {
        await hybridDataService.saveTodoItems(tripId, [...state.todoItems, newItem]);
      }
    );
  };

  const updateTodoItem = async (id: string, updates: Partial<TodoItem>) => {
    await optimisticUpdate(
      prev => ({
        ...prev,
        todoItems: prev.todoItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      }),
      async () => {
        const updatedItems = state.todoItems.map(item =>
          item.id === id ? { ...item, ...updates } : item
        );
        await hybridDataService.saveTodoItems(tripId, updatedItems);
      }
    );
  };

  const deleteTodoItem = async (id: string) => {
    await optimisticUpdate(
      prev => ({
        ...prev,
        todoItems: prev.todoItems.filter(item => item.id !== id)
      }),
      async () => {
        const updatedItems = state.todoItems.filter(item => item.id !== id);
        await hybridDataService.saveTodoItems(tripId, updatedItems);
      }
    );
  };

  // Sync all data
  const syncAll = async () => {
    await loadTripData();
    await syncShoppingList();
  };

  // Debounced save for text inputs
  const debouncedUpdatePackingItem = useDebouncedCallback(updatePackingItem, 150);
  const debouncedUpdateMeal = useDebouncedCallback(updateMeal, 150);

  // Computed values
  const stats = useMemo(() => ({
    totalItems: state.packingItems.length,
    packedItems: state.packingItems.filter(i => i.isPacked).length,
    needToBuy: state.packingItems.filter(i => i.needsToBuy).length,
    totalMeals: state.meals.length,
    completedTodos: state.todoItems.filter(i => i.isCompleted).length,
    totalCost: state.shoppingItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  }), [state.packingItems, state.meals, state.todoItems, state.shoppingItems]);

  return {
    ...state,
    stats,
    updateTrip,
    addPackingItem,
    updatePackingItem: debouncedUpdatePackingItem,
    deletePackingItem,
    addMeal,
    updateMeal: debouncedUpdateMeal,
    deleteMeal,
    updateShoppingItem,
    syncShoppingList,
    addTodoItem,
    updateTodoItem,
    deleteTodoItem,
    syncAll,
    refresh: loadTripData
  };
};

// Placeholder for missing getTrip method
declare module '../services/hybridDataService' {
  interface HybridDataService {
    getTrip(tripId: string): Promise<Trip>;
    updateTrip(tripId: string, updates: Partial<Trip>): Promise<void>;
  }
}