import React from 'react';
import { useTripPerformanceStats } from '../hooks/useTripPerformanceStats';

export function TripPerformanceStatsCard() {
  const { stats, loading, error } = useTripPerformanceStats();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Trip Performance Stats</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Trip Performance Stats</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Trip Performance Stats</h3>
      
      {stats.length === 0 ? (
        <p className="text-gray-500">No trips found.</p>
      ) : (
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.id} className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{stat.trip_name}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Packing Items: {stat.packing_items_count}</div>
                    <div>Meals: {stat.meals_count}</div>
                    <div>Shopping Items: {stat.shopping_items_count}</div>
                    <div>Todo Items: {stat.todo_items_count}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  stat.complexity_level === 'HIGH' 
                    ? 'bg-red-100 text-red-800'
                    : stat.complexity_level === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {stat.complexity_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}