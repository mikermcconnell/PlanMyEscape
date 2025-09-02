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
    console.log('🔍 [SupabaseStorageAdapter.saveTrip] Input trip:', {
      id: trip.id,
      tripName: trip.tripName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      startDateType: typeof trip.startDate,
      endDateType: typeof trip.endDate,
      rawTrip: trip
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 [SupabaseStorageAdapter.saveTrip] Auth check:', { user: !!user, userError });
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
      trip_name: tripName,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      user_id: user.id,
      data: rest, // store the remaining fields in a jsonb column called `data`
    };

    console.log('🔍 [SupabaseStorageAdapter.saveTrip] Trip payload to save:', {
      id: tripPayload.id,
      trip_name: tripPayload.trip_name,
      start_date: tripPayload.start_date,
      end_date: tripPayload.end_date,
      start_date_type: typeof tripPayload.start_date,
      end_date_type: typeof tripPayload.end_date,
      fullPayload: tripPayload
    });

    // Save trip first
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .upsert(tripPayload)
      .select()
      .single();
    
    console.log('🔍 [SupabaseStorageAdapter.saveTrip] Supabase response:', {
      tripData,
      tripError,
      saved_start_date: tripData?.start_date,
      saved_end_date: tripData?.end_date,
      saved_start_date_type: typeof tripData?.start_date,
      saved_end_date_type: typeof tripData?.end_date
    });
    
    if (tripError) throw tripError;

    // Save groups to the groups table
    if (safeTrip.groups && safeTrip.groups.length > 0) {
      console.log('🔍 [SupabaseStorageAdapter.saveTrip] Saving groups to groups table...');
      
      // Delete existing groups for this trip first
      const { error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('trip_id', tripData.id);
      
      if (deleteError) {
        console.error('❌ [SupabaseStorageAdapter.saveTrip] Failed to delete existing groups:', deleteError);
      }
      
      // Map groups to database format
      const groupsToSave = safeTrip.groups.map(group => ({
        id: group.id,
        trip_id: tripData.id,
        name: group.name,
        size: group.size || 1,
        contact_name: group.contactName || null,
        contact_email: group.contactEmail || null,
        color: group.color || null
      }));
      
      console.log('🔍 [SupabaseStorageAdapter.saveTrip] Groups to save:', groupsToSave);
      
      const { data: savedGroups, error: groupsError } = await supabase
        .from('groups')
        .upsert(groupsToSave)
        .select();
      
      if (groupsError) {
        console.error('❌ [SupabaseStorageAdapter.saveTrip] Failed to save groups:', groupsError);
        // Don't throw here - groups are supplementary, trip save succeeded
      } else {
        console.log('✅ [SupabaseStorageAdapter.saveTrip] Groups saved successfully:', savedGroups);
      }
    }

    // Transform the saved data back to Trip format (same logic as getTrips)
    const transformedTrip = {
      ...tripData.data, // spread stored jsonb back in first
      id: tripData.id,
      tripName: tripData.trip_name, // Override with correct DB column
      startDate: tripData.start_date, // Override with correct DB column  
      endDate: tripData.end_date, // Override with correct DB column
      groups: (tripData.data?.groups || []).map(coerceToGroup)
    };

    console.log('🔍 [SupabaseStorageAdapter.saveTrip] Transformed trip result:', {
      id: transformedTrip.id,
      tripName: transformedTrip.tripName,
      startDate: transformedTrip.startDate,
      endDate: transformedTrip.endDate,
      startDateType: typeof transformedTrip.startDate,
      endDateType: typeof transformedTrip.endDate,
      fullTrip: transformedTrip
    });

    return transformedTrip as Trip;
  }

  async getTrips(): Promise<Trip[]> {
    console.log('🔍 [SupabaseStorageAdapter.getTrips] Starting...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 [SupabaseStorageAdapter.getTrips] Auth check:', { user: !!user, userError });
    if (userError || !user) throw new Error('Not signed in');

    // The RLS policy "Users can access owned and shared trips" will automatically
    // return both owned trips and shared trips with status='accepted'
    const { data, error } = await supabase
      .from('trips')
      .select('*');

    console.log('🔍 [SupabaseStorageAdapter.getTrips] Raw Supabase response:', {
      data,
      error,
      dataLength: data?.length,
      firstTrip: data?.[0]
    });

    if (error) throw error;

    // Remove potential duplicates (edge case: if somehow the same trip appears multiple times)
    const uniqueTrips = (data ?? []).reduce((acc: any[], row: any) => {
      if (!acc.find(trip => trip.id === row.id)) {
        acc.push(row);
      }
      return acc;
    }, []);

    const transformedTrips = uniqueTrips.map((row: any) => {
      console.log('🔍 [SupabaseStorageAdapter.getTrips] Processing row:', {
        id: row.id,
        trip_name: row.trip_name,
        start_date: row.start_date,
        end_date: row.end_date,
        start_date_type: typeof row.start_date,
        end_date_type: typeof row.end_date,
        fullRow: row
      });
      
      // First spread the jsonb data, then override with the correctly mapped DB columns
      // This ensures DB columns take precedence over potentially stale data in the jsonb field
      const transformed = {
        ...row.data, // spread stored jsonb back in first
        id: row.id,
        tripName: row.trip_name, // Override with correct DB column
        startDate: row.start_date, // Override with correct DB column  
        endDate: row.end_date, // Override with correct DB column
        groups: (row.data?.groups || []).map(coerceToGroup)
      };
      
      console.log('🔍 [SupabaseStorageAdapter.getTrips] Transformed trip:', {
        id: transformed.id,
        tripName: transformed.tripName,
        startDate: transformed.startDate,
        endDate: transformed.endDate,
        startDateType: typeof transformed.startDate,
        endDateType: typeof transformed.endDate
      });
      
      return transformed;
    }) as Trip[];
    
    console.log('🔍 [SupabaseStorageAdapter.getTrips] Final result:', {
      tripCount: transformedTrips.length,
      trips: transformedTrips.map(t => ({
        id: t.id,
        tripName: t.tripName,
        startDate: t.startDate,
        endDate: t.endDate,
        startDateType: typeof t.startDate,
        endDateType: typeof t.endDate
      }))
    });
    
    return transformedTrips;
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
    try {
      const { data, error } = await supabase.auth.getUser();
      const signedIn = !error && !!data.user;
      console.log('🔍 [HybridStorageAdapter.isSignedIn] Auth status:', { signedIn, user: !!data.user, error });
      return signedIn;
    } catch (e) {
      console.log('🔍 [HybridStorageAdapter.isSignedIn] Exception:', e);
      return false;
    }
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const isSignedIn = await this.isSignedIn();
    console.log('🔍 [HybridStorageAdapter.saveTrip] Using storage:', isSignedIn ? 'Supabase' : 'Local');
    
    if (isSignedIn) {
      return this.supabaseAdapter.saveTrip(trip);
    }
    await this.localAdapter.saveTrip(trip);
    return trip; // local adapter doesn't return value
  }

  async getTrips(): Promise<Trip[]> {
    const isSignedIn = await this.isSignedIn();
    console.log('🔍 [HybridStorageAdapter.getTrips] Using storage:', isSignedIn ? 'Supabase' : 'Local');
    
    return isSignedIn
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