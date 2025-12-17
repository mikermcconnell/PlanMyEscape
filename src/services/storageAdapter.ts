import { Trip } from '../types';
import { TripStorage } from './tripStorage';
import { toGroupColor } from '../utils/storage';
import logger from '../utils/logger';
import { db, auth } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';

/**
 * Generic interface to abstract trip storage operations
 */
export interface StorageAdapter {
  saveTrip(trip: Trip): Promise<Trip>;
  getTrips(): Promise<Trip[]>;
  getTripById(tripId: string): Promise<Trip | null>;
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
 * Firebase implementation of StorageAdapter
 */
export class FirebaseStorageAdapter implements StorageAdapter {
  async saveTrip(trip: Trip): Promise<Trip> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    logger.log('🔍 [FirebaseStorageAdapter.saveTrip] Input trip:', trip);

    // Ensure all group colors are valid before saving
    const safeTrip = {
      ...trip,
      groups: trip.groups.map(group => ({
        ...group,
        color: toGroupColor(group.color)
      }))
    };

    const tripRef = doc(db, 'trips', trip.id);

    // Map frontend Trip shape → DB columns
    // We'll store the main fields at the top level and everything else in a 'data' field
    // to maintain some compatibility with the previous structure if needed, 
    // but Firestore is schema-less so we can just store the object.
    // However, to match the previous logic of separating "data" (jsonb) from columns:

    const { id, tripName, startDate, endDate, ...rest } = safeTrip;

    // Sanitize 'rest' object to remove undefined values (Firestore doesn't support undefined)
    const sanitizedRest = JSON.parse(JSON.stringify(rest));

    const tripPayload = {
      id,
      trip_name: tripName,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      user_id: user.uid,
      data: sanitizedRest, // Store remaining fields in data object
      updated_at: new Date().toISOString()
    };

    await setDoc(tripRef, tripPayload, { merge: true });
    logger.log('✅ [FirebaseStorageAdapter.saveTrip] Trip saved to Firestore');

    // Save groups to a subcollection or separate collection?
    // The previous implementation used a separate 'groups' table.
    // In Firestore, a subcollection `trips/{tripId}/groups` is a good fit.
    // OR a top-level `groups` collection with `trip_id`.
    // Let's use top-level `groups` collection to match the previous relational model closer
    // and allow for easier querying if needed.

    // Save groups using upsert pattern - only delete removed groups
    if (safeTrip.groups && safeTrip.groups.length > 0) {
      const currentGroupIds = new Set(safeTrip.groups.map(g => g.id));

      // Upsert all current groups
      const groupPromises = safeTrip.groups.map(group => {
        const groupRef = doc(db, 'groups', group.id);
        return setDoc(groupRef, {
          id: group.id,
          trip_id: trip.id,
          user_id: user.uid,
          name: group.name,
          size: group.size || 1,
          contact_name: group.contactName || null,
          contact_email: group.contactEmail || null,
          color: group.color || null
        }, { merge: true });
      });
      await Promise.all(groupPromises);

      // Delete only groups that no longer exist
      const groupsQ = query(
        collection(db, 'groups'),
        where('trip_id', '==', trip.id),
        where('user_id', '==', user.uid)
      );
      const existingGroups = await getDocs(groupsQ);
      const deletePromises = existingGroups.docs
        .filter(doc => !currentGroupIds.has(doc.id))
        .map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    }

    return safeTrip;
  }

  async getTrips(): Promise<Trip[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    logger.log(`🔍 [FirebaseStorageAdapter.getTrips] Starting for user: ${user.uid}`);

    const q = query(collection(db, 'trips'), where('user_id', '==', user.uid));
    logger.log('🔍 [FirebaseStorageAdapter.getTrips] Executing trips query...');
    const querySnapshot = await getDocs(q);
    logger.log(`✅ [FirebaseStorageAdapter.getTrips] Found ${querySnapshot.size} trips`);

    const trips: Trip[] = [];

    // We need to fetch groups for these trips.
    // Since Firestore doesn't do joins, we fetch all groups for these trips or fetch per trip.
    // Fetching per trip in a loop is okay for small number of trips.
    // Or fetch all groups for the user? Groups are linked to trips, not directly users in the schema above.
    // But we can query groups where trip_id IN [tripIds] (limit 10) or just fetch all groups for trips we found.

    // Optimized: Fetch all groups for the user in a single query
    // This avoids N+1 queries where we would otherwise fetch groups for each trip individually.
    const tripIds = querySnapshot.docs.map(d => d.id);
    let groupsByTripId: Record<string, any[]> = {};

    if (tripIds.length > 0) {
      logger.log(`🔍 [FirebaseStorageAdapter.getTrips] Fetching all groups for user...`);
      const groupsQuery = query(
        collection(db, 'groups'),
        where('user_id', '==', user.uid)
      );

      const groupsSnapshot = await getDocs(groupsQuery);
      logger.log(`✅ [FirebaseStorageAdapter.getTrips] Found ${groupsSnapshot.size} total groups`);

      groupsSnapshot.forEach(doc => {
        const groupData = doc.data();
        const tripId = groupData.trip_id;

        if (tripId) {
          if (!groupsByTripId[tripId]) {
            groupsByTripId[tripId] = [];
          }
          groupsByTripId[tripId]!.push(groupData);
        }
      });
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const groups = groupsByTripId[data.id] || [];

      // Reconstruct Trip object
      const trip: Trip = {
        ...data.data, // Spread the 'data' field
        id: data.id,
        tripName: data.trip_name,
        startDate: data.start_date,
        endDate: data.end_date,
        groups: groups.map(coerceToGroup)
      };
      trips.push(trip);
    });

    return trips;
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    logger.log(`🔍 [FirebaseStorageAdapter.getTripById] Fetching trip: ${tripId}`);

    // Direct document fetch - O(1) instead of loading all trips
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      logger.log(`⚠️ [FirebaseStorageAdapter.getTripById] Trip not found: ${tripId}`);
      return null;
    }

    const data = tripSnap.data();

    // Verify ownership
    if (data.user_id !== user.uid) {
      logger.log(`⚠️ [FirebaseStorageAdapter.getTripById] Unauthorized access attempt: ${tripId}`);
      return null;
    }

    // Fetch groups for this specific trip
    const groupsQ = query(
      collection(db, 'groups'),
      where('trip_id', '==', tripId),
      where('user_id', '==', user.uid)
    );
    const groupsSnap = await getDocs(groupsQ);
    const groups = groupsSnap.docs.map(d => d.data());

    logger.log(`✅ [FirebaseStorageAdapter.getTripById] Found trip with ${groups.length} groups`);

    // Reconstruct Trip object
    const trip: Trip = {
      ...data.data, // Spread the 'data' field
      id: data.id,
      tripName: data.trip_name,
      startDate: data.start_date,
      endDate: data.end_date,
      groups: groups.map(coerceToGroup)
    };

    return trip;
  }

  async deleteTrip(tripId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');

    // Delete trip doc
    await deleteDoc(doc(db, 'trips', tripId));

    // Delete groups
    const groupsQ = query(
      collection(db, 'groups'),
      where('trip_id', '==', tripId),
      where('user_id', '==', user.uid)
    );
    const groupsSnapshot = await getDocs(groupsQ);
    const deletePromises = groupsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    logger.log('Trip successfully deleted:', { tripId });
  }
}

/**
 * Hybrid adapter – tries Firebase when the user is authenticated,
 * otherwise falls back to IndexedDB via TripStorage. Prevents runtime
 * errors when not signed in and keeps the UI functional offline.
 */
export class HybridStorageAdapter implements StorageAdapter {
  private firebaseAdapter = new FirebaseStorageAdapter();
  private localAdapter = new TripStorage();

  private isSignedIn(): boolean {
    return !!auth.currentUser;
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const isSignedIn = this.isSignedIn();
    logger.log('🔍 [HybridStorageAdapter.saveTrip] Using storage:', isSignedIn ? 'Firebase' : 'Local');

    if (isSignedIn) {
      return this.firebaseAdapter.saveTrip(trip);
    }
    await this.localAdapter.saveTrip(trip);
    return trip;
  }

  async getTrips(): Promise<Trip[]> {
    const isSignedIn = this.isSignedIn();
    logger.log('🔍 [HybridStorageAdapter.getTrips] Using storage:', isSignedIn ? 'Firebase' : 'Local');

    return isSignedIn
      ? this.firebaseAdapter.getTrips()
      : this.localAdapter.getTrips();
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    const isSignedIn = this.isSignedIn();
    logger.log('🔍 [HybridStorageAdapter.getTripById] Using storage:', isSignedIn ? 'Firebase' : 'Local');

    if (isSignedIn) {
      return this.firebaseAdapter.getTripById(tripId);
    }

    // Local fallback - load all trips and filter (IndexedDB doesn't have single-doc fetch)
    const trips = await this.localAdapter.getTrips();
    return trips.find(t => t.id === tripId) || null;
  }

  async deleteTrip(tripId: string): Promise<void> {
    if (this.isSignedIn()) {
      return this.firebaseAdapter.deleteTrip(tripId);
    }
    return this.localAdapter.deleteTrip(tripId);
  }
}