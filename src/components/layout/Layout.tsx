import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tent, Map, Home, Settings as SettingsIcon, LogIn } from 'lucide-react';
import LogoutButton from '../LogoutButton';
import { AuthContext } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // Check if we're in a trip route
  const isInTripRoute = location.pathname.startsWith('/trip/');

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => `
    inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg
    transition-colors duration-150 ease-in-out
    ${isActiveRoute(path)
      ? 'bg-green-100 text-green-700'
      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
    }
  `;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="p-2 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors duration-150">
                  <Tent className="h-8 w-8 text-green-600" />
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">
                  PlanMyEscape
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <Home className="h-5 w-5 mr-2" />
                <span>Dashboard</span>
              </Link>
              <Link to="/trip-setup" className={navLinkClass('/trip-setup')}>
                <Map className="h-5 w-5 mr-2" />
                <span>New Trip</span>
              </Link>
              {user && (
                <Link to="/settings" className={navLinkClass('/settings')}>
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  <span>User Settings</span>
                </Link>
              )}
              {user ? (
                <LogoutButton />
              ) : (
                <Link 
                  to="/signin" 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden">
            {/* Top row - Logo and essential buttons */}
            <div className="flex justify-between items-center h-14 px-1">
              <Link to="/" className="flex items-center group">
                <div className="p-1.5 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors duration-150">
                  <Tent className="h-6 w-6 text-green-600" />
                </div>
                <span className="ml-2 text-lg font-bold text-gray-900">
                  PlanMyEscape
                </span>
              </Link>
              
              <div className="flex items-center space-x-1">
                {user ? (
                  <LogoutButton />
                ) : (
                  <Link 
                    to="/signin" 
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Bottom row - Navigation links */}
            <div className="flex items-center justify-center space-x-1 pb-2 px-1">
              <Link to="/dashboard" className={`${navLinkClass('/dashboard')} flex-1 justify-center max-w-[120px]`}>
                <Home className="h-4 w-4 mr-1" />
                <span className="text-xs">Home</span>
              </Link>
              <Link to="/trip-setup" className={`${navLinkClass('/trip-setup')} flex-1 justify-center max-w-[120px]`}>
                <Map className="h-4 w-4 mr-1" />
                <span className="text-xs">New Trip</span>
              </Link>
              {user && (
                <Link to="/settings" className={`${navLinkClass('/settings')} flex-1 justify-center max-w-[120px]`}>
                  <SettingsIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">Settings</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={isInTripRoute ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {isInTripRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {children}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-2 justify-between text-sm text-gray-600">
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