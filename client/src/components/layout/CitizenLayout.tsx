import { NavLink, Outlet } from 'react-router-dom';
import { AlertCircle, FileText, Map, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

export function CitizenLayout() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => {});
    logout();
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-critical animate-pulseSoft" />
          <h1 className="font-semibold tracking-wide text-white">Citizen SOS Portal</h1>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink
            to="/citizen"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                isActive ? 'text-accent bg-accent/10' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <AlertCircle size={15} /> File SOS
          </NavLink>
          <NavLink
            to="/citizen/reports"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                isActive ? 'text-accent bg-accent/10' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <FileText size={15} /> My Reports
          </NavLink>
          <NavLink
            to="/citizen/map"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                isActive ? 'text-accent bg-accent/10' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Map size={15} /> Public Map
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-critical transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="p-4 max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
