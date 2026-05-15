import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/',            label: 'Dashboard'   },
  { path: '/patrol',      label: 'Live Patrol' },
  { path: '/attendance',  label: 'Attendance'  },
  { path: '/analytics',   label: 'Analytics'   },
  { path: '/history',     label: 'History'     },
  { path: '/settings',    label: 'Settings'    },
];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const shift = h >= 6 && h < 14 ? 'Morning Patrol' : h >= 14 && h < 22 ? 'Afternoon Patrol' : 'Night Patrol';
  return (
    <div className="text-right">
      <div className="text-orange-400 text-sm font-medium">{shift}</div>
      <div className="text-gray-500 text-xs">{now.toLocaleTimeString()}</div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 shrink-0">
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="text-orange-400 font-bold text-base">🛡 SecurePatrol</div>
          <div className="text-gray-600 text-xs mt-0.5">Operations Center</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ path, label }) => (
            <Link key={path} to={path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                location.pathname === path
                  ? 'bg-orange-500/15 text-orange-400 font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-700">
          SecurePatrol v1.0
        </div>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-50"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-5 border-b border-gray-800 flex justify-between items-center">
              <div className="text-orange-400 font-bold">🛡 SecurePatrol</div>
              <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {navItems.map(({ path, label }) => (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    location.pathname === path
                      ? 'bg-orange-500/15 text-orange-400 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}>
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 shrink-0">
          <button className="md:hidden text-gray-400 hover:text-white text-xl"
            onClick={() => setMobileOpen(true)}>☰</button>
          <div className="flex-1" />
          <LiveClock />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
