import {
  Outlet,
  Link,
  useLocation,
} from 'react-router-dom';

export default function DashboardLayout() {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
    },
    {
      name: 'Patrol',
      path: '/dashboard/patrol',
    },
    {
      name: 'Attendance',
      path: '/dashboard/attendance',
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
    },
    {
      name: 'History',
      path: '/dashboard/history',
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-5">
        <h2 className="text-2xl font-bold mb-8">
          Dashboard
        </h2>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active =
              location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
