import React from 'react';
import { Link } from 'react-router-dom';
import { Tent, Package, Utensils, Backpack } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <Tent className="h-8 w-8 text-green-600 dark:text-green-500" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">CampMe</span>
              </Link>
            </div>
            
            <div className="flex space-x-4">
              <Link 
                to="/trip-setup"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-500"
              >
                <Tent className="h-5 w-5 mr-1" />
                New Trip
              </Link>
              <Link 
                to="/gear-locker"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-500"
              >
                <Backpack className="h-5 w-5 mr-1" />
                Gear Locker
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 