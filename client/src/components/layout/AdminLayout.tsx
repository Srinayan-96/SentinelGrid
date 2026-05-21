import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../ui/SidebarNav';
import { LiveClock } from '../ui/LiveClock';
import { LayoutDashboard, List, Users, Shield, BarChart2, FileText } from 'lucide-react';

const items = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/admin/incidents', label: 'Incidents', Icon: List },
  { to: '/admin/responders', label: 'Responders', Icon: Users },
  { to: '/admin/forces', label: 'Forces', Icon: Shield },
  { to: '/admin/analytics', label: 'Analytics', Icon: BarChart2 },
  { to: '/admin/sitreps', label: 'Situation Reports', Icon: FileText },
];

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-bg text-white overflow-hidden">
      <SidebarNav items={items} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulseSoft" />
            <h1 className="font-semibold tracking-wide text-white">Disaster Command Center</h1>
          </div>
          <LiveClock />
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
