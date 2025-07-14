import { Trip, GroupColor } from '../types';
import { TripSchema } from '../schemas';
import { saveTripToDB, getTripsFromDB, deleteTripFromDB } from '../utils/db';
import { toGroupColor } from '../utils/storage';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class TripStorage {
  /**
   * Persist a trip after validation. Throws on validation or storage failure.
   */
  async saveTrip(trip: Trip): Promise<void> {
    // Ensure all group colors are valid GroupColor before validation
    const safeTrip = {
      ...trip,
      groups: trip.groups.map(group => ({
        ...group,
        color: toGroupColor(group.color) as GroupColor
      }))
    };
    
    const validation = TripSchema.safeParse(safeTrip);
    if (!validation.success) {
      throw new ValidationError(JSON.stringify(validation.error.issues));
    }

    try {
      await saveTripToDB(validation.data as Trip);
    } catch (err) {
      throw new StorageError('Failed to save trip', err);
    }
  }

  /** Retrieve all trips or throw on failure */
  async getTrips(): Promise<Trip[]> {
    try {
      return await getTripsFromDB();
    } catch (err) {
      throw new StorageError('Failed to fetch trips', err);
    }
  }

  /** Delete a trip and all related data */
  async deleteTrip(tripId: string): Promise<void> {
    try {
      await deleteTripFromDB(tripId);
    } catch (err) {
      throw new StorageError('Failed to delete trip', err);
    }
  }
} 