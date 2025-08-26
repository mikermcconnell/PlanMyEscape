import { useState, useEffect } from 'react';

export const useOfflineDetection = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline) {
        // Trigger data sync when coming back online
        window.dispatchEvent(new CustomEvent('syncRequired'));
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOffline, wasOffline };
};

// Hook to handle offline-capable operations
export const useOfflineOperation = <T,>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>
) => {
  const { isOffline } = useOfflineDetection();

  const execute = async (): Promise<T> => {
    if (isOffline) {
      console.log('🔌 Offline mode: Using fallback operation');
      return fallback();
    }

    try {
      return await operation();
    } catch (error) {
      console.warn('⚠️ Online operation failed, using fallback:', error);
      return fallback();
    }
  };

  return { execute, isOffline };
};