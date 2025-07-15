import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tent, Map, Home, Settings as SettingsIcon } from 'lucide-react';
import LogoutButton from '../LogoutButton';
import { AuthContext } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => `
    inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
    transition-colors duration-150 ease-in-out
    ${isActiveRoute(path)
      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      : 'text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-500'
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors duration-150">
                  <Tent className="h-8 w-8 text-green-600 dark:text-green-500" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                  PlanMyEscape
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
              <Link to="/trip-setup" className={navLinkClass('/trip-setup')}>
                <Map className="h-5 w-5 mr-2" />
                New Trip
              </Link>
              {user && (
                <Link to="/settings" className={navLinkClass('/settings')}>
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  User Settings
                </Link>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-2 justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>© {new Date().getFullYear()} PlanMyEscape. All rights reserved.</span>
          <div className="space-x-2">
            <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms" className="text-green-600 hover:underline">Terms of Service</Link>
            <span>|</span>
            <Link to="/cookies" className="text-green-600 hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 