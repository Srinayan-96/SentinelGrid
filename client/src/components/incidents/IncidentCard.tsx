import { formatDistanceToNow } from 'date-fns';
import type { Incident } from '../../types';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <article className="border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2">
        <UrgencyBadge urgency={incident.urgency} />
        <StatusBadge status={incident.status} />
      </div>
      <h3 className="text-sm font-semibold">{incident.title}</h3>
      <p className="mt-1 text-xs text-gray-300">{incident.ai_summary || incident.description}</p>
      <p className="mt-2 font-mono text-xs text-gray-400">
        {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
      </p>
    </article>
  );
}
