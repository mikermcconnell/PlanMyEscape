import { Trip } from '../types';
import { StorageAdapter, HybridStorageAdapter } from './storageAdapter';
import { toast } from 'react-toastify';

export class TripService {
  constructor(private adapter: StorageAdapter) {}

  async saveTrip(trip: Trip): Promise<Trip> {
    try {
      return await this.adapter.saveTrip(trip);
    } catch (error) {
      console.error('Failed to save trip:', error);
      toast.error('Unable to save trip');
      throw new Error('Unable to save trip');
    }
  }

  async getTrips(): Promise<Trip[]> {
    try {
      return await this.adapter.getTrips();
    } catch (error) {
      console.error('Failed to load trips:', error);
      toast.error('Unable to load trips');
      throw new Error('Unable to load trips');
    }
  }

  async deleteTrip(tripId: string): Promise<void> {
    try {
      await this.adapter.deleteTrip(tripId);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      toast.error('Unable to delete trip');
      throw new Error('Unable to delete trip');
    }
  }
}

// Default singleton instance using Hybrid
export const tripService = new TripService(new HybridStorageAdapter()); 