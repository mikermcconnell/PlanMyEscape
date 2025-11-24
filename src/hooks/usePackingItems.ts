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
    setIsLoading(true);

    console.log(`🎧 [usePackingItems] Subscribing to packing items for trip ${tripId}`);
    const unsubscribe = hybridDataService.subscribeToPackingItems(tripId, (items) => {
      const itemsWithGroups = (items || []).filter(item => item.assignedGroupId);
      if (itemsWithGroups.length > 0) {
        console.log(`👥 [usePackingItems] ${itemsWithGroups.length} items have group assignments`);
      }

      setItems(items || []);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
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