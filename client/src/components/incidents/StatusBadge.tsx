import type { IncidentStatus } from '../../types';

const classMap: Record<IncidentStatus, string> = {
  OPEN: 'bg-critical/20 text-critical border border-critical/40',
  ASSIGNED: 'bg-accent/20 text-accent border border-accent/40',
  IN_PROGRESS: 'bg-high/20 text-high border border-high/40',
  RESOLVED: 'bg-resolved/20 text-resolved border border-resolved/40',
  FALSE_ALARM: 'bg-gray-500/20 text-gray-200 border border-gray-400/40',
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`px-2 py-1 rounded-full text-[11px] font-mono uppercase ${classMap[status]}`}>{status}</span>;
}
