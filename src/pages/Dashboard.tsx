import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trip, TripType, TRIP_TYPES } from '../types';
import { getTrips } from '../utils/supabaseTrips';
import { Tent, Compass, Mountain, Home, Calendar, Users, ArrowRight, Plus, MapPin, Activity, Trash2 } from 'lucide-react';
import { deleteTrip } from '../utils/storage';

const Dashboard = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getTrips()
      .then(data => setTrips(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
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

  const getTripTypeIcon = (type: TripType) => {
    switch (type) {
      case 'car camping':
        return <Tent className="h-5 w-5" />;
      case 'canoe camping':
        return <Compass className="h-5 w-5" />;
      case 'hike camping':
        return <Mountain className="h-5 w-5" />;
      case 'cottage':
        return <Home className="h-5 w-5" />;
      default:
        return <Tent className="h-5 w-5" />;
    }
  };

  const getTotalCampers = (trip: Trip): number => {
    return trip.groups.reduce((sum, group) => sum + group.size, 0);
  };

  const getTripTypeColor = (type: TripType): string => {
    switch (type) {
      case 'car camping':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'canoe camping':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'hike camping':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'cottage':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTripProgress = (trip: Trip): { completed: number; total: number } => {
    const totalTasks = 3 + (trip.activities?.length || 0);
    let completed = 0;
    
    // Check if has location
    if (trip.location) completed++;
    
    // Check if has activities planned
    if (trip.activities && trip.activities.length > 0) {
      completed++;
      // Count completed activities
      completed += trip.activities.filter(a => a.isCompleted).length;
    }
    
    // Basic trip setup
    completed++;
    
    return { completed, total: totalTasks };
  };

  const getUpcomingTrips = () => {
    const now = new Date();
    return trips.filter(trip => new Date(trip.startDate) >= now).slice(0, 3);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div style={{color:'red'}}>Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Trips</h1>
        <Link
          to="/trip-setup"
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-150"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Trip
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {TRIP_TYPES.map(type => {
          const typeTrips = trips.filter(t => t.tripType === type);
          const upcomingCount = typeTrips.filter(t => new Date(t.startDate) >= new Date()).length;
          
          return (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${getTripTypeColor(type)}`}>
                  {getTripTypeIcon(type)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {typeTrips.length} {typeTrips.length === 1 ? 'Trip' : 'Trips'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {renderTripTypeText(type)}
                  </div>
                  {upcomingCount > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {upcomingCount} upcoming
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Upcoming */}
      {trips.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Trips
            </h2>
            <div className="space-y-3">
              {getUpcomingTrips().map(trip => {
                const progress = getTripProgress(trip);
                const progressPercent = (progress.completed / progress.total) * 100;
                
                return (
                  <div
                    key={trip.id}
                    className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors duration-150 p-4 cursor-pointer relative"
                    onClick={() => navigate(`/trip/${trip.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-gray-900 dark:text-white">{trip.tripName}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTripTypeColor(trip.tripType)}`}>
                          {getTripTypeIcon(trip.tripType)}
                          <span className="ml-1">{renderTripTypeText(trip.tripType)}</span>
                        </span>
                      </div>
                      <button
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                            await deleteTrip(trip.id);
                            setTrips(trips => trips.filter(t => t.id !== trip.id));
                          }
                        }}
                        title="Delete trip"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(trip.startDate).toLocaleDateString()}
                      </div>
                      {trip.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {trip.location}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {progress.completed}/{progress.total} complete
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/trip-setup"
                className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-colors duration-150"
              >
                <Plus className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-200">Plan New Trip</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Start planning your next adventure</p>
                </div>
              </Link>
              
              <Link
                to="/gear-locker"
                className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-colors duration-150"
              >
                <Mountain className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">Manage Gear</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Organize your camping equipment</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* All Trips Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          All Trips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Tent className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trips planned yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Start planning your first adventure! Whether it's a cottage getaway, camping trip, or hiking expedition.
              </p>
              <Link
                to="/trip-setup"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-150 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            trips.map(trip => {
              const progress = getTripProgress(trip);
              const progressPercent = (progress.completed / progress.total) * 100;
              const isUpcoming = new Date(trip.startDate) >= new Date();
              
              return (
                <Link
                  key={trip.id}
                  to={`/trip/${trip.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTripTypeColor(trip.tripType)}`}>
                        <div className="flex items-center space-x-1">
                          {getTripTypeIcon(trip.tripType)}
                          <span>{renderTripTypeText(trip.tripType)}</span>
                        </div>
                      </div>
                      {isUpcoming && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Upcoming
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {trip.tripName}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {trip.location && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="truncate">{trip.location}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>
                            {getTotalCampers(trip)} {getTotalCampers(trip) === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                                                 {trip.activities && trip.activities.length > 0 && (
                           <div className="flex items-center">
                             <Activity className="h-4 w-4 mr-1" />
                             <span>{trip.activities.length} activities</span>
                           </div>
                         )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Trip Progress</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 