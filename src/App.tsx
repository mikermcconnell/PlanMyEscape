import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import TripSetup from './pages/TripSetup';
import PackingList from './pages/PackingList';
import MealPlanner from './pages/MealPlanner';
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
import { InvitationPage } from './pages/InvitationPage';

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

          {/* Main app routes - allow unauthenticated access */}
          <Route path="/dashboard" element={<ProtectedRoute allowUnauthenticated={true}><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/trip-setup" element={<ProtectedRoute allowUnauthenticated={true}><Layout><TripSetup /></Layout></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute allowUnauthenticated={true}><Layout><Notes /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><PrivacySettings /></Layout></ProtectedRoute>} />
          <Route path="/signin" element={<SupaSignIn />} />
          <Route path="/invite/:token" element={<InvitationPage />} />
          
          {/* Trip-specific routes with navigation - allow unauthenticated access */}
          <Route path="/trip/:tripId" element={<ProtectedRoute allowUnauthenticated={true}><Layout><TripContainer /></Layout></ProtectedRoute>}>
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