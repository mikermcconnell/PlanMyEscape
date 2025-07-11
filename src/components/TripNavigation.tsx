import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Utensils, Calendar, ShoppingCart } from 'lucide-react';

interface TripNavigationProps {
  tripId: string;
  tripName: string;
}

const TripNavigation: React.FC<TripNavigationProps> = ({ tripId, tripName }) => {
  const location = useLocation();

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      path: `/trip/${tripId}`,
      description: 'Trip details and activities'
    },
    {
      id: 'packing',
      label: 'Packing List',
      icon: Package,
      path: `/trip/${tripId}/packing`,
      description: 'Gear and packing checklist'
    },
    {
      id: 'meals',
      label: 'Meal Planning',
      icon: Utensils,
      path: `/trip/${tripId}/meals`,
      description: 'Meal planning and recipes'
    },
    {
      id: 'shopping',
      label: 'Shopping',
      icon: ShoppingCart,
      path: `/trip/${tripId}/shopping`,
      description: 'Combined shopping list'
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      path: `/trip/${tripId}/schedule`,
      description: 'Daily schedule and activities'
    }
  ];

  const isActiveTab = (path: string) => {
    if (path === `/trip/${tripId}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trip Header */}
        <div className="py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tripName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage all aspects of your trip
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveTab(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out whitespace-nowrap
                  ${isActive 
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                title={item.description}
              >
                <Icon className="h-5 w-5 mr-2" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TripNavigation; 