import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import Navbar from './components/Navbar';

import Home from './pages/Home';
import Architecture from './pages/Architecture';
import Dashboard from './pages/Dashboard';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 ${
        darkMode ? 'dark' : ''
      }`}
    >
      <BrowserRouter>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
