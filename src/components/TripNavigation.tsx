import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Utensils, Calendar, ShoppingCart, Users } from 'lucide-react';

interface TripNavigationProps {
  tripId: string;
  tripName: string;
  onShowSharing?: () => void;
  canShare?: boolean;
}

const TripNavigation: React.FC<TripNavigationProps> = ({ tripId, tripName, onShowSharing, canShare }) => {
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
      label: 'Shopping List',
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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trip Header */}
        <div className="py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {tripName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage all aspects of your trip
              </p>
            </div>
            {canShare && onShowSharing && (
              <div className="text-right">
                <button
                  onClick={onShowSharing}
                  className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Share Trip
                </button>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Invite others to view or collaborate on this trip
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative">
          {/* Gradient fade on right to indicate more content */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 sm:hidden"></div>
          <div className="flex space-x-0 overflow-x-auto scrollbar-hide pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveTab(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center px-3 sm:px-6 py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out whitespace-nowrap min-w-0 flex-shrink-0
                  ${isActive 
                    ? 'border-green-500 text-green-600 bg-green-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                title={item.description}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripNavigation; 