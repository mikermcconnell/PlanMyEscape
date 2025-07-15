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
      
      // Provide more specific error messages
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
      
      throw error; // Re-throw the original error for further handling
    }
  }
}

// Default singleton instance using Hybrid
export const tripService = new TripService(new HybridStorageAdapter()); 