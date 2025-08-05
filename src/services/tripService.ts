import { Trip } from '../types';
import { StorageAdapter, HybridStorageAdapter } from './storageAdapter';
import { toast } from 'react-toastify';
import { supabase } from '../supabaseClient';

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

  async getTripPerformanceStats(): Promise<TripPerformanceStats[]> {
    try {
      console.log('🔍 [TripService.getTripPerformanceStats] Starting...');
      
      // Call the security definer function that handles user isolation
      const { data, error } = await supabase.rpc('get_user_trip_performance_stats');
      
      if (error) {
        console.error('🔴 [TripService.getTripPerformanceStats] Supabase error:', error);
        throw new Error(`Failed to fetch performance stats: ${error.message}`);
      }
      
      console.log('🔍 [TripService.getTripPerformanceStats] Result:', {
        statsCount: data?.length || 0,
        stats: data?.slice(0, 3) // Log first 3 for debugging
      });
      
      return data || [];
    } catch (error) {
      console.error('🔴 [TripService.getTripPerformanceStats] Error:', error);
      toast.error('Unable to load trip performance stats');
      throw new Error('Unable to load trip performance stats');
    }
  }
}

// Default singleton instance using Hybrid
export const tripService = new TripService(new HybridStorageAdapter()); 