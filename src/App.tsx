import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TripSetup from './pages/TripSetup';
import PackingList from './pages/PackingList';
import MealPlanner from './pages/MealPlanner';
import GearLocker from './pages/GearLocker';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trip-setup" element={<TripSetup />} />
          <Route path="/packing-list/:tripId" element={<PackingList />} />
          <Route path="/meal-planner/:tripId" element={<MealPlanner />} />
          <Route path="/gear-locker" element={<GearLocker />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 