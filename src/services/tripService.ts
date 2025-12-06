import { Trip } from '../types';
import { StorageAdapter, HybridStorageAdapter } from './storageAdapter';
import { toast } from 'react-toastify';
import logger from '../utils/logger';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export interface TripPerformanceStats {
  id: string;
  trip_name: string;
  user_id: string;
  packing_items_count: number;
  meals_count: number;
  shopping_items_count: number;
  todo_items_count: number;
  complexity_level: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  updated_at: string;
}

export class TripService {
  constructor(private adapter: StorageAdapter) { }

  async saveTrip(trip: Trip): Promise<Trip> {
    try {
      return await this.adapter.saveTrip(trip);
    } catch (error) {
      logger.error('[TripService.saveTrip] Failed to save trip', error);
      toast.error('Unable to save trip');
      throw new Error('Unable to save trip');
    }
  }

  async getTrips(): Promise<Trip[]> {
    try {
      return await this.adapter.getTrips();
    } catch (error) {
      logger.error('[TripService.getTrips] Failed to load trips', error);
      toast.error('Unable to load trips');
      throw new Error('Unable to load trips');
    }
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    try {
      return await this.adapter.getTripById(tripId);
    } catch (error) {
      logger.error('[TripService.getTripById] Failed to load trip', error);
      // Don't show toast for single trip load - let component handle it
      return null;
    }
  }

  async deleteTrip(tripId: string): Promise<void> {
    try {
      await this.adapter.deleteTrip(tripId);
    } catch (error) {
      logger.error('[TripService.deleteTrip] Failed to delete trip', error);

      if (error instanceof Error) {
        if (error.message.includes('Not signed in')) {
          toast.error('Please sign in to delete trips');
        } else if (error.message.includes('Trip not found')) {
          toast.error('Trip not found or you do not have permission to delete it');
        } else if (error.message.includes('permission')) {
          toast.error('You do not have permission to delete this trip');
        } else {
          toast.error(`Unable to delete trip: ${error.message}`);
        }
      } else {
        toast.error('Unable to delete trip');
      }

      throw error;
    }
  }

  async getTripPerformanceStats(): Promise<TripPerformanceStats[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      // Since we don't have a stored procedure, we'll fetch trips and count items.
      // This is expensive if there are many trips, but for a single user it should be fine.
      // Alternatively, we could maintain counters on the trip document.
      // For now, let's just return basic stats or empty to unblock.

      const trips = await this.getTrips();
      const stats: TripPerformanceStats[] = [];

      for (const trip of trips) {
        // Parallelize these counts
        const [packingCount, mealsCount, shoppingCount, todoCount] = await Promise.all([
          getCountFromServer(query(collection(db, 'packing_items'), where('trip_id', '==', trip.id), where('user_id', '==', user.uid))),
          getCountFromServer(query(collection(db, 'meals'), where('trip_id', '==', trip.id), where('user_id', '==', user.uid))),
          getCountFromServer(query(collection(db, 'shopping_items'), where('trip_id', '==', trip.id), where('user_id', '==', user.uid))),
          getCountFromServer(query(collection(db, 'todo_items'), where('trip_id', '==', trip.id), where('user_id', '==', user.uid)))
        ]);

        const totalItems = packingCount.data().count + mealsCount.data().count + shoppingCount.data().count + todoCount.data().count;
        let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (totalItems > 50) complexity = 'MEDIUM';
        if (totalItems > 150) complexity = 'HIGH';

        stats.push({
          id: trip.id,
          trip_name: trip.tripName,
          user_id: user.uid,
          packing_items_count: packingCount.data().count,
          meals_count: mealsCount.data().count,
          shopping_items_count: shoppingCount.data().count,
          todo_items_count: todoCount.data().count,
          complexity_level: complexity,
          created_at: new Date().toISOString(), // We don't have this easily available without fetching more
          updated_at: new Date().toISOString()
        });
      }

      return stats;

    } catch (error) {
      logger.error('[TripService.getTripPerformanceStats] Failed to load stats', error);
      // Don't throw, just return empty to avoid breaking UI
      return [];
    }
  }
}

export const tripService = new TripService(new HybridStorageAdapter());
