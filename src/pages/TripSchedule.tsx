import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock, Activity as ActivityIcon, Utensils, Plus } from 'lucide-react';
import { getMeals } from '../utils/storage';
import { saveTrip } from '../utils/supabaseTrips';
import { Trip, Meal } from '../types';
import ActivitiesPlanner from '../components/ActivitiesPlanner';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', color: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', color: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200', icon: '☀️' },
  { key: 'evening', label: 'Evening', color: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200', icon: '🌆' },
  { key: 'night', label: 'Night', color: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-200', icon: '🌙' }
];

const TripSchedule: React.FC = () => {
  const { trip, setTrip } = useOutletContext<TripContextType>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [showActivitiesPlanner, setShowActivitiesPlanner] = useState(false);
  const [selectedDayForActivities, setSelectedDayForActivities] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getMeals(trip.id);
      setMeals(data);
    })();
  }, [trip.id]);

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

  const generateDays = () => {
    const days = getDaysBetweenDates(trip.startDate, trip.endDate);
    const startDate = new Date(trip.startDate);
    
    return Array.from({ length: days }, (_, index) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      return {
        dayNumber: index + 1,
        date: currentDate,
        activities: trip.activities?.filter(activity =>
          activity.schedules && activity.schedules.some(s => s.day === index + 1)
        ) || [],
        meals: meals.filter(m => m.day === index + 1)
      };
    });
  };

  const scheduleData = generateDays();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Trip Schedule
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Daily itinerary and planned activities for your {scheduleData.length}-day trip
        </p>
      </div>

      <div className="space-y-8">
        {scheduleData.map((day) => (
          <div
            key={day.dayNumber}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Day {day.dayNumber}
                  </h3>
                  <p className="text-base font-medium text-gray-600 dark:text-gray-300">
                    {day.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {day.dayNumber === 1 && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-500 text-white shadow-sm">
                    🚀 Departure Day
                  </span>
                )}
                {day.dayNumber === scheduleData.length && scheduleData.length > 1 && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-500 text-white shadow-sm">
                    🏁 Return Day
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <span className="flex items-center space-x-1">
                <span>📋</span>
                <span>{day.activities.length} activities</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>✅</span>
                <span>{day.activities.filter(a => a.isCompleted).length} completed</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🍽️</span>
                <span>{day.meals.length} meals planned</span>
              </span>
            </div>

            {/* Scheduled Meals */}
            {day.meals.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Utensils className="h-4 w-4 text-orange-600 dark:text-orange-400"/>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Meals</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {day.meals.map(meal => {
                    const mealIcon = meal.type === 'breakfast' ? '🍳' : meal.type === 'lunch' ? '🥪' : meal.type === 'dinner' ? '🍽️' : '🍿';
                    const getMealTypeColor = (type: string) => {
                      switch (type) {
                        case 'breakfast':
                          return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
                        case 'lunch':
                          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                        case 'dinner':
                          return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
                        default:
                          return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
                      }
                    };
                    return (
                      <div key={meal.id} className={`flex items-center space-x-3 p-3 ${getMealTypeColor(meal.type)} border rounded-lg`}>
                        <span className="text-2xl">{mealIcon}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{meal.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{meal.type}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scheduled Activities by Time Slot */}
            {TIME_SLOTS.map(slot => {
              const slotActivities = day.activities.filter(a =>
                a.schedules && a.schedules.some(s => s.day === day.dayNumber && s.timeOfDay === slot.key)
              );
              if (slotActivities.length === 0) return null;
              return (
                <div key={slot.key} className="mb-6">
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-l-4 ${slot.color} mb-3`}>
                    <span className="text-xl">{slot.icon}</span>
                    <h4 className="text-lg font-bold">{slot.label}</h4>
                    <span className="text-sm opacity-75">({slotActivities.length} activities)</span>
                  </div>
                  <div className="space-y-3">
                    {slotActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <ActivityIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                              {activity.name}
                            </h5>
                            {activity.equipment && activity.equipment.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {activity.equipment.slice(0, 3).map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                                    🎒 {item}
                                  </span>
                                ))}
                                {activity.equipment.length > 3 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">+{activity.equipment.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          {activity.isCompleted && (
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                ✓ Done
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* If no activities at all, show empty state */}
            {day.activities.length === 0 && (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Free Day Ahead!
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No activities scheduled - perfect for spontaneous adventures
                </p>
                <button
                  onClick={() => {
                    setSelectedDayForActivities(day.dayNumber);
                    setShowActivitiesPlanner(true);
                  }}
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium text-sm transition-colors"
                >
                  + Add activities
                </button>
              </div>
            )}

            {/* Add Activities button for days with existing activities */}
            {day.activities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    setSelectedDayForActivities(day.dayNumber);
                    setShowActivitiesPlanner(true);
                  }}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add More Activities
                </button>
              </div>
            )}

            {/* Default Schedule Items */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                Typical Day Structure
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Morning: Breakfast & Activities</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Afternoon: Main Activities</span>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Evening: Dinner & Relaxation</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activities Planner Modal */}
      {showActivitiesPlanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Activities</h3>
                <button
                  onClick={() => {
                    setShowActivitiesPlanner(false);
                    setSelectedDayForActivities(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <ActivitiesPlanner
                activities={trip.activities || []}
                onActivitiesChange={(activities) => {
                  updateTripActivities(activities);
                  setShowActivitiesPlanner(false);
                  setSelectedDayForActivities(null);
                }}
                tripType={trip.tripType}
                tripDays={getDaysBetweenDates(trip.startDate, trip.endDate)}
                tripId={trip.id}
                defaultDay={selectedDayForActivities || undefined}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TripSchedule; 