import { Trip } from '../types';
import { StorageAdapter, HybridStorageAdapter } from './storageAdapter';
import { toast } from 'react-toastify';

export class TripService {
  constructor(private adapter: StorageAdapter) {}

  async saveTrip(trip: Trip): Promise<Trip> {
    try {
      console.log('🔍 [TripService.saveTrip] Input:', {
        id: trip.id,
        tripName: trip.tripName,
        startDate: trip.startDate,
        endDate: trip.endDate,
        startDateType: typeof trip.startDate,
        endDateType: typeof trip.endDate
      });
      
      const result = await this.adapter.saveTrip(trip);
      
      console.log('🔍 [TripService.saveTrip] Result:', {
        id: result.id,
        tripName: result.tripName,
        startDate: result.startDate,
        endDate: result.endDate,
        startDateType: typeof result.startDate,
        endDateType: typeof result.endDate
      });
      
      return result;
    } catch (error) {
      console.error('🔴 [TripService.saveTrip] Error:', error);
      toast.error('Unable to save trip');
      throw new Error('Unable to save trip');
    }
  }

  async getTrips(): Promise<Trip[]> {
    try {
      console.log('🔍 [TripService.getTrips] Starting...');
      
      const trips = await this.adapter.getTrips();
      
      console.log('🔍 [TripService.getTrips] Result:', {
        tripCount: trips.length,
        trips: trips.map(t => ({
          id: t.id,
          tripName: t.tripName,
          startDate: t.startDate,
          endDate: t.endDate,
          startDateType: typeof t.startDate,
          endDateType: typeof t.endDate
        }))
      });
      
      return trips;
    } catch (error) {
      console.error('🔴 [TripService.getTrips] Error:', error);
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