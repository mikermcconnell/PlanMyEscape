import { useState, useEffect, useCallback, useRef } from 'react';
import { PackingItem } from '../types';
import { hybridDataService } from '../services/hybridDataService';

interface UsePackingItemsReturn {
  items: PackingItem[];
  setItems: (items: PackingItem[]) => void;
  updateItems: (items: PackingItem[], immediate?: boolean) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const usePackingItems = (tripId: string): UsePackingItemsReturn => {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const immediateSave = useCallback(
    async (tripId: string, items: PackingItem[]) => {
      try {
        await hybridDataService.savePackingItems(tripId, items);
      } catch (error) {
        console.error('Failed to save packing list:', error);
        setError('Failed to save packing list. Please try again.');
      }
    },
    []
  );

  const debouncedSave = useCallback(
    (tripId: string, items: PackingItem[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await hybridDataService.savePackingItems(tripId, items);
          saveTimeoutRef.current = null;
        } catch (error) {
          console.error('Failed to save packing list:', error);
          setError('Failed to save packing list. Please try again.');
          saveTimeoutRef.current = null;
        }
      }, 150);
    },
    []
  );

  const updateItems = useCallback(
    (newItems: PackingItem[], immediate = false) => {
      setItems(newItems);
      if (immediate) {
        immediateSave(tripId, newItems);
      } else {
        debouncedSave(tripId, newItems);
      }
    },
    [tripId, debouncedSave, immediateSave]
  );

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        const data = await hybridDataService.getPackingItems(tripId);
        
        // Debug group assignments on initial load
        const itemsWithGroups = (data || []).filter(item => item.assignedGroupId);
        console.log(`🚀 [usePackingItems] LOADED ${data?.length || 0} items from data service`);
        if (itemsWithGroups.length > 0) {
          console.log(`👥 [usePackingItems] ${itemsWithGroups.length} items have group assignments on LOAD:`);
          itemsWithGroups.forEach(item => {
            console.log(`  - "${item.name}": assignedGroupId = ${item.assignedGroupId}`);
            
            // Check if this matches previous assignment attempts
            const debugKey = 'debug_group_assignment_' + item.id;
            const savedDebug = localStorage.getItem(debugKey);
            if (savedDebug) {
              const debugData = JSON.parse(savedDebug);
              console.log(`  🔍 Previous assignment attempt: ${debugData.groupName || debugData.assignedGroupId} at ${new Date(debugData.timestamp).toLocaleTimeString()}`);
              if (debugData.newGroupId !== item.assignedGroupId) {
                console.error(`  ❌ ASSIGNMENT LOST! Expected: ${debugData.newGroupId}, Got: ${item.assignedGroupId}`);
              }
            }
            
            // Check if this was a user-added item
            const userAddedDebugKey = 'debug_user_added_' + item.id;
            const userAddedDebug = localStorage.getItem(userAddedDebugKey);
            if (userAddedDebug) {
              const userDebugData = JSON.parse(userAddedDebug);
              console.log(`  🆕 User-added item "${item.name}" was created with group: ${userDebugData.assignedGroupId} at ${new Date(userDebugData.timestamp).toLocaleTimeString()}`);
              if (userDebugData.assignedGroupId !== item.assignedGroupId) {
                console.error(`  🚨 USER-ADDED ITEM GROUP LOST! "${item.name}" was created with group ${userDebugData.assignedGroupId}, now has: ${item.assignedGroupId}`);
              }
            }
          });
        } else {
          console.log(`⚠️ [usePackingItems] No items with group assignments found on load`);
        }
        
        setItems(data || []);
      } catch (error) {
        console.error('Error loading packing items:', error);
        setError('Failed to load packing items');
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [tripId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const currentItems = items;
    const currentTripId = tripId;
    
    return () => {
      if (currentItems.length > 0) {
        hybridDataService.savePackingItems(currentTripId, currentItems).catch(error => {
          console.error('Failed to save on unmount:', error);
        });
      }
    };
  }, [items, tripId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    items,
    setItems,
    updateItems,
    isLoading,
    error,
    clearError
  };
};