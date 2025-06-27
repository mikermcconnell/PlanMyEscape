import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trip, TripType } from '../types';
import { getTrips } from '../utils/storage';

const Dashboard = () => {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      const savedTrips = await getTrips();
      setTrips(savedTrips);
    };
    loadTrips();
  }, []);

  const renderTripTypeText = (type: TripType): string => {
    switch (type) {
      case 'car camping':
        return 'Car Camping';
      case 'canoe camping':
        return 'Canoe Camping';
      case 'hike camping':
        return 'Hike Camping';
      case 'cottage':
        return 'Cottage';
      default:
        return type;
    }
  };

  const getTripTypeCount = (type: TripType): number => {
    return trips.filter(t => t.type === type).length;
  };

  const getTotalCampers = (trip: Trip): number => {
    return trip.groups.reduce((sum, group) => sum + group.size, 0);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {getTripTypeCount('car camping')}
          </div>
          <div className="text-sm text-gray-500">Car Camping</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {getTripTypeCount('canoe camping')}
          </div>
          <div className="text-sm text-gray-500">Canoe Camping</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {getTripTypeCount('hike camping')}
          </div>
          <div className="text-sm text-gray-500">Hike Camping</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-orange-600">
            {getTripTypeCount('cottage')}
          </div>
          <div className="text-sm text-gray-500">Cottage</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map(trip => (
          <Link
            key={trip.id}
            to={`/trip/${trip.id}`}
            className="block bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="font-bold text-lg mb-2">{trip.tripName}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {renderTripTypeText(trip.type)}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {getTotalCampers(trip)} {getTotalCampers(trip) === 1 ? 'person' : 'people'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 