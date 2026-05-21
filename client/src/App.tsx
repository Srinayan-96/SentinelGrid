import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import LoginPage from './pages/LoginPage';
import SOSPage from './pages/citizen/SOSPage';
import CommandDashboard from './pages/command/Dashboard';
import ResponderMission from './pages/responder/Mission';

const LegacyApp = React.lazy(() => import('./App.jsx'));

function RequireAuth({ children, role }: { children: React.ReactNode; role: 'CITIZEN' | 'COMMAND' | 'RESPONDER' }) {
  const { user } = useAppStore();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeGate() {
  const { user } = useAppStore();
  if (!user) return <LoginPage />;
  if (user.role === 'CITIZEN') return <Navigate to="/citizen/sos" replace />;
  if (user.role === 'COMMAND') return <Navigate to="/command/dashboard" replace />;
  return <Navigate to="/responder/mission" replace />;
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />

      <Route
        path="/citizen/sos"
        element={
          <RequireAuth role="CITIZEN">
            <SOSPage />
          </RequireAuth>
        }
      />

      <Route
        path="/command/dashboard"
        element={
          <RequireAuth role="COMMAND">
            <CommandDashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/responder/mission"
        element={
          <RequireAuth role="RESPONDER">
            <ResponderMission />
          </RequireAuth>
        }
      />

      {/* Keep older JSX app reachable (doesn't remove features) */}
      <Route
        path="/legacy/*"
        element={
          <React.Suspense
            fallback={<div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">Loading…</div>}
          >
            <LegacyApp />
          </React.Suspense>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
