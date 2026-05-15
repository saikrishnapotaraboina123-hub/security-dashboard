import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Architecture from './pages/Architecture';
import Firmware from './pages/Firmware';
import Backend from './pages/Backend';
import FrontendPage from './pages/FrontendPage';
import Dashboard from './pages/Dashboard';
import DevOps from './pages/DevOps';
import Testing from './pages/Testing';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <BrowserRouter>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main><Routes>
          <Route path="/" element={<Home />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/firmware" element={<Firmware />} />
          <Route path="/backend" element={<Backend />} />
          <Route path="/frontend" element={<FrontendPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devops" element={<DevOps />} />
          <Route path="/testing" element={<Testing />} />
        </Routes></main>
      </BrowserRouter>
    </div>
  );
}
export default App;
