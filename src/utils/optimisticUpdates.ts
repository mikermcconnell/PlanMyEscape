/**
 * Utilities for handling optimistic updates with automatic rollback
 */

import { useState, useCallback, useRef } from 'react';

interface OptimisticState<T> {
  data: T;
  pending: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic updates with automatic rollback
 */
export const useOptimisticUpdate = <T>(
  initialData: T,
  onError?: (error: Error) => void
) => {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    pending: false,
    error: null
  });

  const previousDataRef = useRef<T>(initialData);

  const update = useCallback(async (
    optimisticData: T | ((prev: T) => T),
    persistOperation: () => Promise<void>
  ) => {
    // Store current data for potential rollback
    previousDataRef.current = state.data;

    // Apply optimistic update
    setState(prev => ({
      data: typeof optimisticData === 'function' 
        ? (optimisticData as (prev: T) => T)(prev.data)
        : optimisticData,
      pending: true,
      error: null
    }));

    try {
      // Persist the change
      await persistOperation();
      
      // Success - clear pending state
      setState(prev => ({
        ...prev,
        pending: false,
        error: null
      }));
    } catch (error) {
      // Rollback on failure
      setState({
        data: previousDataRef.current,
        pending: false,
        error: error as Error
      });

      if (onError) {
        onError(error as Error);
      }

      throw error; // Re-throw for component handling
    }
  }, [state.data, onError]);

  const reset = useCallback(() => {
    setState({
      data: previousDataRef.current,
      pending: false,
      error: null
    });
  }, []);

  return {
    data: state.data,
    pending: state.pending,
    error: state.error,
    update,
    reset,
    setData: (data: T) => setState(prev => ({ ...prev, data }))
  };
};

/**
 * Batch optimistic updates
 */
export class OptimisticUpdateQueue<T> {
  private queue: Array<{
    id: string;
    update: () => T;
    persist: () => Promise<void>;
    rollback: () => T;
  }> = [];
  
  private processing = false;
  private onStateChange: (state: T) => void;
  private onError: (error: Error, id: string) => void;
  private currentState: T;

  constructor(
    initialState: T,
    onStateChange: (state: T) => void,
    onError?: (error: Error, id: string) => void
  ) {
    this.currentState = initialState;
    this.onStateChange = onStateChange;
    this.onError = onError || (() => {});
  }

  /**
   * Add an update to the queue
   */
  add(
    id: string,
    update: () => T,
    persist: () => Promise<void>,
    rollback?: () => T
  ) {
    this.queue.push({
      id,
      update,
      persist,
      rollback: rollback || (() => this.currentState)
    });

    if (!this.processing) {
      this.process();
    }
  }

  /**
   * Process the queue
   */
  private async process() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.queue.shift()!;
    
    // Apply optimistic update
    const previousState = this.currentState;
    this.currentState = item.update();
    this.onStateChange(this.currentState);

    try {
      // Persist the change
      await item.persist();
    } catch (error) {
      // Rollback on failure
      this.currentState = item.rollback();
      this.onStateChange(this.currentState);
      this.onError(error as Error, item.id);
    }

    // Process next item
    this.process();
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}

/**
 * Hook for batch optimistic updates
 */
export const useOptimisticBatch = <T>(
  initialData: T,
  onError?: (error: Error, updateId: string) => void
) => {
  const [data, setData] = useState<T>(initialData);
  const queueRef = useRef<OptimisticUpdateQueue<T>>();

  if (!queueRef.current) {
    queueRef.current = new OptimisticUpdateQueue(
      initialData,
      setData,
      onError
    );
  }

  const batchUpdate = useCallback((
    id: string,
    optimisticUpdate: () => T,
    persistOperation: () => Promise<void>,
    rollbackUpdate?: () => T
  ) => {
    queueRef.current!.add(id, optimisticUpdate, persistOperation, rollbackUpdate);
  }, []);

  return {
    data,
    batchUpdate,
    clearQueue: () => queueRef.current!.clear(),
    queueSize: () => queueRef.current!.size()
  };
};

/**
 * Optimistic update with retry logic
 */
export const useOptimisticWithRetry = <T>(
  initialData: T,
  maxRetries: number = 3,
  retryDelay: number = 1000
) => {
  const [state, setState] = useState<{
    data: T;
    pending: boolean;
    error: Error | null;
    retryCount: number;
  }>({
    data: initialData,
    pending: false,
    error: null,
    retryCount: 0
  });

  const updateWithRetry = useCallback(async (
    optimisticData: T | ((prev: T) => T),
    persistOperation: () => Promise<void>
  ) => {
    const previousData = state.data;
    
    // Apply optimistic update
    setState(prev => ({
      data: typeof optimisticData === 'function'
        ? (optimisticData as (prev: T) => T)(prev.data)
        : optimisticData,
      pending: true,
      error: null,
      retryCount: 0
    }));

    const attemptPersist = async (attempt: number): Promise<void> => {
      try {
        await persistOperation();
        
        // Success
        setState(prev => ({
          ...prev,
          pending: false,
          error: null,
          retryCount: 0
        }));
      } catch (error) {
        if (attempt < maxRetries) {
          // Retry after delay
          setState(prev => ({
            ...prev,
            retryCount: attempt + 1
          }));
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          return attemptPersist(attempt + 1);
        } else {
          // Max retries reached - rollback
          setState({
            data: previousData,
            pending: false,
            error: error as Error,
            retryCount: 0
          });
          throw error;
        }
      }
    };

    return attemptPersist(0);
  }, [state.data, maxRetries, retryDelay]);

  return {
    data: state.data,
    pending: state.pending,
    error: state.error,
    retryCount: state.retryCount,
    update: updateWithRetry
  };
};