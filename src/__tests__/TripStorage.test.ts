import { TripStorage, ValidationError } from '../services/tripStorage';
import { Trip } from '../types';
import { saveTripToDB } from '../utils/db';

jest.mock('../utils/db', () => ({
  saveTripToDB: jest.fn(() => Promise.resolve()),
  getTripsFromDB: jest.fn(() => Promise.resolve([])),
  deleteTripFromDB: jest.fn(() => Promise.resolve())
}));

const storage = new TripStorage();

const baseTrip: Trip = {
  id: '1',
  tripName: 'Test Trip',
  tripType: 'car camping',
  startDate: '2024-01-01',
  endDate: '2024-01-05',
  isCoordinated: false,
  groups: [],
  activities: [],
  emergencyContacts: []
};

describe('TripStorage', () => {
  it('saves a valid trip', async () => {
    await storage.saveTrip(baseTrip);
    expect(saveTripToDB).toHaveBeenCalledWith(baseTrip);
  });

  it('throws on invalid trip', async () => {
    const badTrip = { ...baseTrip, tripName: '' } as Trip;
    await expect(storage.saveTrip(badTrip)).rejects.toBeInstanceOf(ValidationError);
  });
}); 