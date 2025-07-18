import { Trip } from '../types';
import { supabase } from '../supabaseClient';
import { TripStorage } from './tripStorage';
import { toGroupColor } from '../utils/storage';

/**
 * Generic interface to abstract trip storage operations
 */
export interface StorageAdapter {
  saveTrip(trip: Trip): Promise<Trip>;
  getTrips(): Promise<Trip[]>;
  deleteTrip(tripId: string): Promise<void>;
}

// Helper to coerce any raw group object to a valid Group
function coerceToGroup(group: any): any {
  return {
    id: group.id,
    name: group.name,
    size: group.size,
    contactName: group.contactName,
    contactEmail: group.contactEmail,
    color: toGroupColor(group.color)
  };
}

/**
 * Supabase implementation of StorageAdapter
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  async saveTrip(trip: Trip): Promise<Trip> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');

    // Ensure all group colors are valid before saving
    const safeTrip = {
      ...trip,
      groups: trip.groups.map(group => ({
        ...group,
        color: toGroupColor(group.color)
      }))
    };

    // Map frontend Trip shape → DB columns (using existing schema)
    const { id, tripName, startDate, endDate, ...rest } = safeTrip as any;
    const tripPayload: any = {
      id,
      name: tripName,
      start: startDate ?? null,
      end: endDate ?? null,
      user_id: user.id,
      data: rest, // store the remaining fields in a jsonb column called `data`
    };

    // Save trip first
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .upsert(tripPayload)
      .select()
      .single();
    if (tripError) throw tripError;

    // Return the saved trip (existing data format)
    return tripData as Trip;
  }

  async getTrips(): Promise<Trip[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tripName: row.name,
      startDate: row.start,
      endDate: row.end,
      ...row.data, // spread stored jsonb back in
      groups: (row.data?.groups || []).map(coerceToGroup)
    })) as Trip[];
  }

  async deleteTrip(tripId: string): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Delete trip failed: User not authenticated', { userError });
      throw new Error('Not signed in');
    }

    console.log('Attempting to delete trip:', { tripId, userId: user.id });

    const { data, error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', user.id)
      .select(); // Return deleted rows to verify deletion

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('No trip deleted - trip not found or access denied:', { tripId, userId: user.id });
      throw new Error('Trip not found or you do not have permission to delete this trip');
    }

    console.log('Trip successfully deleted:', { tripId, deletedCount: data.length });
  }
}

/**
 * Hybrid adapter – tries Supabase when the user is authenticated,
 * otherwise falls back to IndexedDB via TripStorage. Prevents runtime
 * errors when not signed in and keeps the UI functional offline.
 */
export class HybridStorageAdapter implements StorageAdapter {
  private supabaseAdapter = new SupabaseStorageAdapter();
  private localAdapter = new TripStorage();

  private async isSignedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getUser();
    return !!data.user;
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    if (await this.isSignedIn()) {
      return this.supabaseAdapter.saveTrip(trip);
    }
    await this.localAdapter.saveTrip(trip);
    return trip; // local adapter doesn't return value
  }

  async getTrips(): Promise<Trip[]> {
    return (await this.isSignedIn())
      ? this.supabaseAdapter.getTrips()
      : this.localAdapter.getTrips();
  }

  async deleteTrip(tripId: string): Promise<void> {
    if (await this.isSignedIn()) {
      return this.supabaseAdapter.deleteTrip(tripId);
    }
    return this.localAdapter.deleteTrip(tripId);
  }
} 