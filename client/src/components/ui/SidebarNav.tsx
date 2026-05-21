import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
      <nav className="flex-1 space-y-0.5 p-2 pt-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border-l-accent bg-accent/10 text-accent'
                  : 'border-l-transparent text-gray-400 hover:bg-surface hover:text-white'
              }`
            }
          >
            <item.Icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
