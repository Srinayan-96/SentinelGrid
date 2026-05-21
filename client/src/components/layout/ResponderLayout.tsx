import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../ui/SidebarNav';
import { Radio, Target, Map, BarChart2 } from 'lucide-react';
import { TacticalAlerts } from '../ui/TacticalAlerts';

const items = [
  { to: '/responder/feed', label: 'Live Feed', Icon: Radio },
  { to: '/responder/missions', label: 'My Missions', Icon: Target },
  { to: '/responder/map', label: 'Map', Icon: Map },
  { to: '/responder/stats', label: 'My Stats', Icon: BarChart2 },
];

export function ResponderLayout() {
  return (
    <div className="flex h-screen bg-bg text-white overflow-hidden">
      <SidebarNav items={items} />
      <main className="flex-1 overflow-auto p-4">
        <div className="mb-3">
          <TacticalAlerts />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
