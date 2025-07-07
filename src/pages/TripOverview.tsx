import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Trip, TripType } from '../types';
import { saveTrip } from '../utils/supabaseTrips';
import WeatherCard from '../components/WeatherCard';
import ActivitiesPlanner from '../components/ActivitiesPlanner';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const TripOverview: React.FC = () => {
  const { trip, setTrip } = useOutletContext<TripContextType>();
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [locationInput, setLocationInput] = useState(trip.location || '');

  const updateTripLocation = async () => {
    const updatedTrip = { ...trip, location: locationInput };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
      setShowLocationEdit(false);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const updateTripActivities = async (activities: Trip['activities']) => {
    const updatedTrip = { ...trip, activities };
    setTrip(updatedTrip);
    try {
      await saveTrip(updatedTrip);
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const getDaysBetweenDates = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

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

  const totalCampers = trip.groups.reduce((sum, group) => sum + group.size, 0);

  return (
    <div className="p-6 space-y-8">
      {/* Trip Summary */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              {renderTripTypeText(trip.tripType)} • {totalCampers} {totalCampers === 1 ? 'person' : 'people'}
            </p>
          </div>
        </div>

        {/* Trip Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dates</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
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

            {trip.description && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {trip.description}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <WeatherCard 
              startDate={trip.startDate}
              endDate={trip.endDate}
              location={trip.location}
            />
          </div>
        </div>
      </div>

      {/* Groups Section */}
      {trip.isCoordinated && trip.groups.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip.groups.map(group => (
              <div
                key={group.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: `${group.color}15` }}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" style={{ color: group.color }} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{group.name}</p>
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
      <div>
        <ActivitiesPlanner
          activities={trip.activities || []}
          onActivitiesChange={updateTripActivities}
          tripType={trip.tripType}
          tripDays={getDaysBetweenDates(trip.startDate, trip.endDate)}
          tripId={trip.id}
        />
      </div>
    </div>
  );
};

export default TripOverview; 