// Deprecated direct Supabase utilities. Use tripService instead.
import { Trip } from '../types';
import { tripService } from '../services/tripService';

export async function saveTrip(trip: Trip) {
  return tripService.saveTrip(trip);
}

export async function getTrips() {
  return tripService.getTrips();
} 