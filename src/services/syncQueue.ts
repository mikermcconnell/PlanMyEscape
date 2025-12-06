/**
 * Sync Queue Service
 * Queues changes made while offline and syncs when connectivity is restored
 */

import logger from '../utils/logger';

interface SyncOperation {
    id: string;
    type: 'save' | 'delete';
    collection: string;
    tripId: string;
    data: unknown;
    timestamp: number;
    retryCount: number;
}

const DB_NAME = 'planmyescape-sync';
const STORE_NAME = 'pending-operations';
const MAX_RETRIES = 3;

class SyncQueueService {
    private db: IDBDatabase | null = null;
    private isOnline: boolean = navigator.onLine;
    private isSyncing: boolean = false;

    constructor() {
        this.initDB();
        this.setupEventListeners();
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onerror = () => {
                logger.error('[SyncQueue] Failed to open database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                logger.log('[SyncQueue] Database initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    logger.log('[SyncQueue] Object store created');
                }
            };
        });
    }

    private setupEventListeners(): void {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            logger.log('[SyncQueue] Connection restored');
            this.isOnline = true;
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            logger.log('[SyncQueue] Connection lost');
            this.isOnline = false;
        });

        // Listen for service worker sync messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'SYNC_REQUESTED') {
                    this.processQueue();
                }
            });
        }
    }

    /**
     * Add an operation to the sync queue
     */
    async addToQueue(
        type: 'save' | 'delete',
        collection: string,
        tripId: string,
        data: unknown
    ): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        const operation: SyncOperation = {
            id: crypto.randomUUID(),
            type,
            collection,
            tripId,
            data,
            timestamp: Date.now(),
            retryCount: 0
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(operation);

            request.onsuccess = () => {
                logger.log(`[SyncQueue] Operation queued: ${type} ${collection}`);
                resolve();

                // Try to sync immediately if online
                if (this.isOnline) {
                    this.processQueue();
                }
            };

            request.onerror = () => {
                logger.error('[SyncQueue] Failed to queue operation');
                reject(request.error);
            };
        });
    }

    /**
     * Get pending operations count
     */
    async getPendingCount(): Promise<number> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Process all pending operations in the queue
     */
    async processQueue(): Promise<void> {
        if (this.isSyncing || !this.isOnline) return;

        this.isSyncing = true;
        logger.log('[SyncQueue] Processing queue...');

        try {
            const operations = await this.getAllOperations();

            for (const operation of operations) {
                try {
                    await this.executeOperation(operation);
                    await this.removeFromQueue(operation.id);
                    logger.log(`[SyncQueue] Synced: ${operation.type} ${operation.collection}`);
                } catch (error) {
                    logger.error(`[SyncQueue] Failed to sync operation:`, error);

                    if (operation.retryCount >= MAX_RETRIES) {
                        // Remove after max retries
                        await this.removeFromQueue(operation.id);
                        logger.warn(`[SyncQueue] Dropped operation after ${MAX_RETRIES} retries`);
                    } else {
                        // Increment retry count
                        await this.updateRetryCount(operation.id, operation.retryCount + 1);
                    }
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }

    private async getAllOperations(): Promise<SyncOperation[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by timestamp (oldest first)
                const operations = request.result.sort((a, b) => a.timestamp - b.timestamp);
                resolve(operations);
            };
            request.onerror = () => reject(request.error);
        });
    }

    private async executeOperation(operation: SyncOperation): Promise<void> {
        // Dynamically import hybridDataService to avoid circular dependencies
        const { hybridDataService } = await import('./hybridDataService');

        switch (operation.collection) {
            case 'packing_items':
                if (operation.type === 'save') {
                    await hybridDataService.savePackingItems(operation.tripId, operation.data as any);
                }
                break;
            case 'meals':
                if (operation.type === 'save') {
                    await hybridDataService.saveMeals(operation.tripId, operation.data as any);
                }
                break;
            case 'shopping_items':
                if (operation.type === 'save') {
                    await hybridDataService.saveShoppingItems(operation.tripId, operation.data as any);
                }
                break;
            case 'todo_items':
                if (operation.type === 'save') {
                    await hybridDataService.saveTodoItems(operation.tripId, operation.data as any);
                }
                break;
            default:
                logger.warn(`[SyncQueue] Unknown collection: ${operation.collection}`);
        }
    }

    private async removeFromQueue(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async updateRetryCount(id: string, retryCount: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const operation = getRequest.result;
                if (operation) {
                    operation.retryCount = retryCount;
                    const putRequest = store.put(operation);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Check if browser supports background sync
     */
    async requestBackgroundSync(): Promise<void> {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await (registration as any).sync.register('sync-changes');
                logger.log('[SyncQueue] Background sync registered');
            } catch (error) {
                logger.warn('[SyncQueue] Background sync not available:', error);
            }
        }
    }
}

export const syncQueueService = new SyncQueueService();
