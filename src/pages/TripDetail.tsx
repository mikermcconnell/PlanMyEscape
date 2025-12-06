import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tent, Package, Utensils, Users, Calendar, MapPin, Activity } from 'lucide-react';
import { Trip, TripType } from '../types';
import { tripService } from '../services/tripService';
import WeatherCard from '../components/WeatherCard';
import ActivitiesPlanner from '../components/ActivitiesPlanner';

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrip = async () => {
      setLoading(true);
      try {
        // Use direct trip lookup instead of loading all trips
        const currentTrip = await tripService.getTripById(tripId!);
        if (currentTrip) {
          setTrip(currentTrip);
          setLocationInput(currentTrip.location || '');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      loadTrip();
    }
  }, [tripId]);

  const updateTripLocation = async () => {
    if (!trip || !tripId) return;
    const updatedTrip = { ...trip, location: locationInput };
    setTrip(updatedTrip);
    await tripService.saveTrip(updatedTrip);
    setShowLocationEdit(false);
  };

  const updateTripActivities = async (activities: Trip['activities']) => {
    if (!trip || !tripId) return;
    const updatedTrip = { ...trip, activities };
    setTrip(updatedTrip);
    await tripService.saveTrip(updatedTrip);
  };

  const getDaysBetweenDates = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) return <div>Loading trip...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Tent className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Trip not found</h3>
          <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Trip Name
                {(!trip.tripName || trip.tripName.trim() === '') && (
                  <span className="text-red-600 ml-2">(required)</span>
                )}
              </label>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{trip.tripName}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {renderTripTypeText(trip.tripType)} • {totalCampers} {totalCampers === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/trip/${trip.id}/packing`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Packing List
            </Link>
            <Link
              to={`/trip/${trip.id}/meals`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Utensils className="h-4 w-4 mr-2" />
              Meal Planner
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trip Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dates</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Location (optional)
                  </label>
                  {showLocationEdit ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Enter trip location..."
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={updateTripLocation}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowLocationEdit(false)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trip.location || 'No location set'}
                      </p>
                      <button
                        onClick={() => setShowLocationEdit(true)}
                        className="text-xs text-green-600 hover:text-green-700 transition-colors"
                      >
                        {trip.location ? 'Edit' : 'Add Location'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <WeatherCard
                startDate={trip.startDate}
                endDate={trip.endDate}
                location={trip.location}
              />
            </div>
          </div>

          {trip.description && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{trip.description}</p>
            </div>
          )}
        </div>

        {trip.isCoordinated && trip.groups.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trip.groups.map(group => (
                <div
                  key={group.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${group.color}20` }}
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" style={{ color: group.color }} />
                    <div>
                      <p className="font-medium" style={{ color: group.color }}>{group.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.size} {group.size === 1 ? 'person' : 'people'}
                      </p>
                      {group.contactName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Contact: {group.contactName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities Section */}
        <div className="mt-8">
          <ActivitiesPlanner
            activities={trip.activities || []}
            onActivitiesChange={updateTripActivities}
            tripType={trip.tripType}
            tripDays={getDaysBetweenDates(trip.startDate, trip.endDate)}
            tripId={trip.id}
          />
        </div>
      </div>
    </div>
  );
};

export default TripDetail; 