import React, { useState, useEffect } from 'react';
import { useParams, Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Tent } from 'lucide-react';
import { Trip } from '../types';
import { getTrips } from '../utils/supabaseTrips';
import TripNavigation from './TripNavigation';

const TripContainer: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrip = async () => {
      if (!tripId) {
        console.log('🔍 [TripContainer] No tripId provided');
        return;
      }
      
      console.log('🔍 [TripContainer] Loading trip:', { tripId });
      setLoading(true);
      try {
        const trips = await getTrips();
        console.log('🔍 [TripContainer] All trips loaded:', {
          tripCount: trips.length,
          trips: trips.map(t => ({
            id: t.id,
            tripName: t.tripName,
            startDate: t.startDate,
            endDate: t.endDate,
            startDateType: typeof t.startDate,
            endDateType: typeof t.endDate
          }))
        });
        
        const currentTrip = trips.find((t: Trip) => t.id === tripId);
        console.log('🔍 [TripContainer] Found trip:', {
          tripId,
          found: !!currentTrip,
          trip: currentTrip ? {
            id: currentTrip.id,
            tripName: currentTrip.tripName,
            startDate: currentTrip.startDate,
            endDate: currentTrip.endDate,
            startDateType: typeof currentTrip.startDate,
            endDateType: typeof currentTrip.endDate,
            fullTrip: currentTrip
          } : null
        });
        
        setTrip(currentTrip || null);
        
      } catch (error) {
        console.error('🔴 [TripContainer] Failed to load trip:', error);
      }
      setLoading(false);
    };
    
    loadTrip();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Tent className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Trip not found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The trip you're looking for doesn't exist or has been deleted.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-150"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back to Dashboard Link */}
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Trip Navigation */}
      <TripNavigation 
        tripId={trip.id} 
        tripName={trip.tripName}
      />

      {/* Trip Content */}
      <div className="mt-6">
        <Outlet context={{ trip, setTrip }} />
      </div>


    </div>
  );
};

export default TripContainer; 