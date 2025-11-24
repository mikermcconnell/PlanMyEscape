import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { cleanupOldSecurityLogs } from './securityLogger';

/**
 * Data Retention Policy Manager
 * Implements Google Play Console compliant data retention and ephemeral processing
 */
export class DataRetentionPolicy {
  private static initialized = false;
  private static sessionCleanupTimer?: number;
  private static dailyCleanupTimer?: number;
  // Retention periods in days
  static readonly SECURITY_LOGS_RETENTION_DAYS = 90;
  static readonly USER_DATA_RETENTION_DAYS = 365;
  static readonly TEMP_SESSION_DATA_MINUTES = 30;

  /**
   * Run complete data cleanup according to retention policies
   */
  static async runDataCleanup(): Promise<void> {
    console.log('🧹 [DataRetentionPolicy] Starting scheduled data cleanup...');

    try {
      // Clean up old security logs
      await cleanupOldSecurityLogs(this.SECURITY_LOGS_RETENTION_DAYS);

      // Clean up old user data (for deleted accounts or inactive users)
      await this.cleanupInactiveUserData();

      // Clean up temporary session data
      this.cleanupTempSessionData();

      console.log('✅ [DataRetentionPolicy] Data cleanup completed successfully');
    } catch (error) {
      console.error('❌ [DataRetentionPolicy] Data cleanup failed:', error);
    }
  }

  /**
   * Clean up data for users who have been inactive beyond retention period
   */
  private static async cleanupInactiveUserData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.USER_DATA_RETENTION_DAYS);

    try {
      // Note: This would typically be handled by a backend job with proper user consent
      // For now, we'll just log the cleanup intent
      console.log(`🗄️ [DataRetentionPolicy] Would clean user data older than ${cutoffDate.toISOString()}`);

      // In a production environment, this would:
      // 1. Identify inactive users
      // 2. Send notification before deletion
      // 3. Allow users to opt-in to keep their data
      // 4. Delete data only after proper consent flow

    } catch (error) {
      console.error('Failed to cleanup inactive user data:', error);
    }
  }

  /**
   * Clean up temporary session data from local storage
   */
  static cleanupTempSessionData(): void {
    const now = Date.now();
    const cutoffTime = now - (this.TEMP_SESSION_DATA_MINUTES * 60 * 1000);

    // Clean up temporary data that should be processed ephemerally
    const keysToCheck = [
      'temp_',
      'cache_',
      'session_',
      'analytics_',
      'tracking_'
    ];

    let cleanedCount = 0;

    keysToCheck.forEach(prefix => {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.timestamp && data.timestamp < cutoffTime) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Remove corrupted data
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleanedCount++;
      });
    });

    if (cleanedCount > 0) {
      console.log(`🗑️ [DataRetentionPolicy] Cleaned ${cleanedCount} temporary data items`);
    }
  }

  /**
   * Initialize data retention policy enforcement
   */
  static initialize(): void {
    // Run initial cleanup
    this.cleanupTempSessionData();

    // Schedule regular cleanup every hour
    setInterval(() => {
      this.cleanupTempSessionData();
    }, 60 * 60 * 1000);

    // Schedule daily comprehensive cleanup
    setInterval(() => {
      this.runDataCleanup();
    }, 24 * 60 * 60 * 1000);

    console.log('📋 [DataRetentionPolicy] Data retention policy initialized');
  }

  /**
   * Process data ephemerally - use for temporary processing that shouldn't persist
   */
  static processEphemeralData<T>(data: T, processor: (data: T) => any): any {
    try {
      // Process data in memory only
      const result = processor(data);

      // Clear sensitive data from memory if it's an object
      if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(key => {
          if (key.includes('password') || key.includes('token') || key.includes('secret')) {
            (data as any)[key] = undefined;
          }
        });
      }

      return result;
    } catch (error) {
      console.error('Ephemeral data processing failed');
      throw error;
    }
  }

  /**
   * Delete all user data for GDPR compliance
   */
  static async deleteAllUserData(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required for data deletion');
    }

    console.log(`🗑️ [DataRetentionPolicy] Deleting all data for user (hashed ID: ${await this.hashUserId(userId)})`);

    try {
      // Delete from all user data collections
      const collections = ['trips', 'packing_items', 'meals', 'shopping_items', 'gear_items', 'todo_items', 'security_logs', 'packing_templates', 'meal_templates'];

      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('user_id', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) continue;

        const batch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          count++;
        });

        await batch.commit();
        console.log(`Deleted ${count} documents from ${collectionName}`);
      }

      console.log('✅ [DataRetentionPolicy] User data deletion completed');
    } catch (error) {
      console.error('❌ [DataRetentionPolicy] User data deletion failed:', error);
      throw error;
    }
  }

  /**
   * Hash user ID for privacy-compliant logging
   */
  private static async hashUserId(userId: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(userId);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch {
      return 'hashed_id';
    }
  }
}
