import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import TripSetup from './pages/TripSetup';
import PackingList from './pages/PackingList';
import MealPlanner from './pages/MealPlanner';
import GearLocker from './pages/GearLocker';
import TripContainer from './components/TripContainer';
import TripOverview from './pages/TripOverview';
import TripSchedule from './pages/TripSchedule';
import ErrorBoundary from './components/ErrorBoundary';
import SupaSignIn from './components/SupaSignIn';
import ProtectedRoute from './components/ProtectedRoute';
import Notes from './pages/Notes';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import PrivacySettings from './pages/PrivacySettings';
import ShoppingListPage from './pages/ShoppingListPage';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public privacy policy */}
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Public terms and cookie policy */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />

          {/* Authenticated routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/trip-setup" element={<ProtectedRoute><Layout><TripSetup /></Layout></ProtectedRoute>} />
          <Route path="/gear-locker" element={<ProtectedRoute><Layout><GearLocker /></Layout></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Layout><Notes /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><PrivacySettings /></Layout></ProtectedRoute>} />
          <Route path="/signin" element={<SupaSignIn />} />
          
          {/* Trip-specific routes with navigation */}
          <Route path="/trip/:tripId" element={<ProtectedRoute><TripContainer /></ProtectedRoute>}>
            <Route index element={<TripOverview />} />
            <Route path="packing" element={<PackingList />} />
            <Route path="meals" element={<MealPlanner />} />
            <Route path="schedule" element={<TripSchedule />} />
            <Route path="shopping" element={<ShoppingListPage />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 