import { Trip } from '../types';
import { StorageAdapter, HybridStorageAdapter } from './storageAdapter';

export class TripService {
  constructor(private adapter: StorageAdapter) {}

  async saveTrip(trip: Trip): Promise<Trip> {
    try {
      return await this.adapter.saveTrip(trip);
    } catch (error) {
      console.error('Failed to save trip:', error);
      throw new Error('Unable to save trip');
    }
  }

  async getTrips(): Promise<Trip[]> {
    try {
      return await this.adapter.getTrips();
    } catch (error) {
      console.error('Failed to load trips:', error);
      throw new Error('Unable to load trips');
    }
  }
}

// Default singleton instance using Hybrid
export const tripService = new TripService(new HybridStorageAdapter()); 