import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import Navbar from './components/Navbar';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import Architecture from './pages/Architecture';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Guards from './pages/Guards';

// Placeholder Pages
const Patrol = () => (
  <div className="text-white p-6 text-xl">
    Live Patrol — coming soon
  </div>
);

const Attendance = () => (
  <div className="text-white p-6 text-xl">
    Attendance — coming soon
  </div>
);

const Analytics = () => (
  <div className="text-white p-6 text-xl">
    Analytics — coming soon
  </div>
);

const Settings = () => (
  <div className="text-white p-6 text-xl">
    Settings — coming soon
  </div>
);

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'dark bg-gray-950' : 'bg-gray-100'
      }`}
    >
      <BrowserRouter>
        {/* Navbar */}
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Routes */}
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route
            path="/architecture"
            element={<Architecture />}
          />

          {/* Dashboard Layout Routes */}
          <Route
            path="/dashboard"
            element={<DashboardLayout />}
          >
            {/* default dashboard page */}
            <Route index element={<Dashboard />} />

            <Route
              path="patrol"
              element={<Patrol />}
            />

            <Route
              path="attendance"
              element={<Attendance />}
            />

            <Route
              path="analytics"
              element={<Analytics />}
            />

            <Route
              path="history"
              element={<History />}
            />

            <Route
              path="settings"
              element={<Settings />}
            />

            {/* ✅ ADDED THIS */}
            <Route
              path="guards"
              element={<Guards />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
