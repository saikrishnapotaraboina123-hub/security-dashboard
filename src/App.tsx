import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import Navbar from './components/Navbar';
import DashboardLayout from './layouts/DashboardLayout';

import Home from './pages/Home';
import Architecture from './pages/Architecture';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Guards from './pages/Guards';

// 🔥 NEW PAGES (we are preparing for next steps)
import PatrolMapPage from './pages/PatrolMapPage';

const Patrol = () => (
  <div className="text-white p-6">Live Patrol — coming soon</div>
);

const Attendance = () => (
  <div className="text-white p-6">Attendance — coming soon</div>
);

const Analytics = () => (
  <div className="text-white p-6">Analytics — coming soon</div>
);

const Settings = () => (
  <div className="text-white p-6">Settings — coming soon</div>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={darkMode ? 'dark bg-gray-950 min-h-screen' : 'bg-gray-100 min-h-screen'}>

      <BrowserRouter>

        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <Routes>

          {/* ======================
              PUBLIC ROUTES
          ====================== */}
          <Route path="/" element={<Home />} />
          <Route path="/architecture" element={<Architecture />} />

          {/* ======================
              DASHBOARD ROUTES
          ====================== */}
          <Route path="/dashboard" element={<DashboardLayout />}>

            <Route index element={<Dashboard />} />

            <Route path="patrol" element={<Patrol />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="analytics" element={<Analytics />} />

            {/* LIVE HISTORY */}
            <Route path="history" element={<History />} />

            {/* GUARDS */}
            <Route path="guards" element={<Guards />} />

            {/* 🔥 NEW: LIVE MAP TRACKING */}
            <Route path="map" element={<PatrolMapPage />} />

            <Route path="settings" element={<Settings />} />

          </Route>

        </Routes>

      </BrowserRouter>

    </div>
  );
}
