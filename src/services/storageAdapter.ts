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

    // Map frontend Trip shape → DB columns
    const { id, tripName, startDate, endDate, ...rest } = safeTrip as any;
    const payload: any = {
      id,
      name: tripName,
      start: startDate ?? null,
      end: endDate ?? null,
      user_id: user.id,
      data: rest, // store the remaining fields in a jsonb column called `data`
    };

    const { data, error } = await supabase
      .from('trips')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Trip;
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
    if (userError || !user) throw new Error('Not signed in');

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) throw error;
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