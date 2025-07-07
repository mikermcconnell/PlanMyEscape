import { Trip } from '../types';
import { supabase } from '../supabaseClient';
import { TripStorage } from './tripStorage';

/**
 * Generic interface to abstract trip storage operations
 */
export interface StorageAdapter {
  saveTrip(trip: Trip): Promise<Trip>;
  getTrips(): Promise<Trip[]>;
}

/**
 * Supabase implementation of StorageAdapter
 */
export class SupabaseStorageAdapter implements StorageAdapter {
  async saveTrip(trip: Trip): Promise<Trip> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not signed in');

    const { data, error } = await supabase
      .from('trips')
      .upsert({ ...trip, user_id: user.id })
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
    return data as Trip[];
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
} 