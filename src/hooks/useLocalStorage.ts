import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Enhanced localStorage hook with cross-tab synchronization
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    syncAcrossTabs?: boolean;
    debounceMs?: number;
  }
) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
    debounceMs = 0
  } = options || {};

  // Get initial value from localStorage or use provided initial value
  const getStoredValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Save to localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const save = () => {
        window.localStorage.setItem(key, serialize(valueToStore));
        
        // Dispatch custom event for cross-tab sync
        if (syncAcrossTabs) {
          window.dispatchEvent(new CustomEvent('localStorage-sync', {
            detail: { key, value: valueToStore }
          }));
        }
      };

      if (debounceMs > 0) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(save, debounceMs);
      } else {
        save();
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue, syncAcrossTabs, debounceMs]);

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      if (syncAcrossTabs) {
        window.dispatchEvent(new CustomEvent('localStorage-sync', {
          detail: { key, value: null }
        }));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, syncAcrossTabs]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.error(`Error syncing localStorage key "${key}":`, error);
        }
      }
    };

    const handleCustomSync = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value ?? initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorage-sync' as any, handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage-sync' as any, handleCustomSync);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, initialValue, deserialize, syncAcrossTabs]);

  return [storedValue, setValue, removeValue] as const;
};

/**
 * Hook for syncing multiple localStorage keys
 */
export const useLocalStorageSync = (
  keys: string[],
  onSync?: (key: string, value: any) => void
) => {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && keys.includes(e.key) && e.newValue !== null) {
        try {
          const value = JSON.parse(e.newValue);
          if (onSync) {
            onSync(e.key, value);
          }
        } catch (error) {
          console.error(`Error syncing key "${e.key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [keys, onSync]);
};

/**
 * Hook for localStorage with expiration
 */
export const useLocalStorageWithExpiry = <T>(
  key: string,
  initialValue: T,
  expiryMs: number
) => {
  interface StoredData {
    value: T;
    expiry: number;
  }

  const [value, setValue] = useLocalStorage<StoredData | null>(key, null);

  // Get value if not expired
  const getValue = useCallback((): T => {
    if (!value) return initialValue;
    
    const now = Date.now();
    if (now > value.expiry) {
      // Expired - remove and return initial value
      setValue(null);
      return initialValue;
    }
    
    return value.value;
  }, [value, initialValue, setValue]);

  // Set value with expiry
  const setValueWithExpiry = useCallback((newValue: T) => {
    setValue({
      value: newValue,
      expiry: Date.now() + expiryMs
    });
  }, [setValue, expiryMs]);

  return [getValue(), setValueWithExpiry] as const;
};

/**
 * Hook for managing localStorage quota
 */
export const useLocalStorageQuota = () => {
  const [quota, setQuota] = useState<{
    used: number;
    available: number;
    percentage: number;
  }>({ used: 0, available: 0, percentage: 0 });

  useEffect(() => {
    const calculateQuota = async () => {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const available = estimate.quota || 0;
          const percentage = available > 0 ? (used / available) * 100 : 0;
          
          setQuota({ used, available, percentage });
        } else {
          // Fallback: estimate based on localStorage size
          let totalSize = 0;
          for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              totalSize += localStorage[key].length + key.length;
            }
          }
          
          // Assume 10MB quota (common default)
          const assumed = 10 * 1024 * 1024;
          setQuota({
            used: totalSize,
            available: assumed,
            percentage: (totalSize / assumed) * 100
          });
        }
      } catch (error) {
        console.error('Error calculating storage quota:', error);
      }
    };

    calculateQuota();
    
    // Recalculate on storage events
    const handleStorage = () => calculateQuota();
    window.addEventListener('storage', handleStorage);
    
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const clearOldData = useCallback((daysOld: number = 30) => {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let cleared = 0;
    
    Object.keys(localStorage).forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.timestamp && parsed.timestamp < cutoff) {
            localStorage.removeItem(key);
            cleared++;
          }
        }
      } catch {
        // Not a timestamped item, skip
      }
    });
    
    return cleared;
  }, []);

  return {
    ...quota,
    clearOldData,
    isNearLimit: quota.percentage > 80,
    formatSize: (bytes: number) => {
      const units = ['B', 'KB', 'MB', 'GB'];
      let size = bytes;
      let unitIndex = 0;
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
  };
};