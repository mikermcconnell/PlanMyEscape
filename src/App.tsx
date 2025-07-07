import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TripSetup from './pages/TripSetup';
import PackingList from './pages/PackingList';
import MealPlanner from './pages/MealPlanner';
import GearLocker from './pages/GearLocker';
import TripContainer from './components/TripContainer';
import TripOverview from './pages/TripOverview';
import TripSchedule from './pages/TripSchedule';
import ErrorBoundary from './components/ErrorBoundary';
import SupaSignIn from './components/SupaSignIn';
import Notes from './pages/Notes';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Main layout routes */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/trip-setup" element={<Layout><TripSetup /></Layout>} />
          <Route path="/gear-locker" element={<Layout><GearLocker /></Layout>} />
          <Route path="/notes" element={<Layout><Notes /></Layout>} />
          <Route path="/signin" element={<SupaSignIn />} />
          
          {/* Trip-specific routes with navigation */}
          <Route path="/trip/:tripId" element={<TripContainer />}>
            <Route index element={<TripOverview />} />
            <Route path="packing" element={<PackingList />} />
            <Route path="meals" element={<MealPlanner />} />
            <Route path="schedule" element={<TripSchedule />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 