import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock, Activity as ActivityIcon, Utensils } from 'lucide-react';
import { getMeals } from '../utils/storage';
import { Trip, Meal } from '../types';

interface TripContextType {
  trip: Trip;
  setTrip: (trip: Trip) => void;
}

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' }
];

const TripSchedule: React.FC = () => {
  const { trip } = useOutletContext<TripContextType>();
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getMeals(trip.id);
      setMeals(data);
    })();
  }, [trip.id]);

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

      <div className="space-y-6">
        {scheduleData.map((day) => (
          <div
            key={day.dayNumber}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Day {day.dayNumber}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {day.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              {day.dayNumber === 1 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Departure Day
                </span>
              )}
              {day.dayNumber === scheduleData.length && scheduleData.length > 1 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Return Day
                </span>
              )}
            </div>

            {/* Scheduled Meals */}
            {day.meals.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center"><Utensils className="h-4 w-4 mr-1"/>Meals</h4>
                <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-200 space-y-1">
                  {day.meals.map(meal => (
                    <li key={meal.id}>{meal.type.charAt(0).toUpperCase()+meal.type.slice(1)}: {meal.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scheduled Activities by Time Slot */}
            {TIME_SLOTS.map(slot => {
              const slotActivities = day.activities.filter(a =>
                a.schedules && a.schedules.some(s => s.day === day.dayNumber && s.timeOfDay === slot.key)
              );
              if (slotActivities.length === 0) return null;
              return (
                <div key={slot.key} className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{slot.label}</h4>
                  <div className="space-y-2">
                    {slotActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <ActivityIcon className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.name}
                          </p>
                          {activity.equipment && activity.equipment.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Equipment: {activity.equipment.join(', ')}
                            </p>
                          )}
                        </div>
                        {activity.isCompleted && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Completed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* If no activities at all, show empty state */}
            {day.activities.length === 0 && (
              <div className="text-center py-6">
                <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No activities scheduled for this day
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Add activities in the Overview tab to see them here
                </p>
              </div>
            )}

            {/* Default Schedule Items */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typical Day Structure
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Morning: Breakfast & Activities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Afternoon: Main Activities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Evening: Dinner & Relaxation</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Future Enhancement Notice */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Enhanced Scheduling Coming Soon
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Future updates will include detailed time scheduling, meal planning integration, 
              and automatic suggestions based on your trip type and activities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSchedule; 