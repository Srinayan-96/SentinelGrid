import type { IncidentUrgency } from '../../types';

const classMap: Record<IncidentUrgency, string> = {
  CRITICAL: 'bg-critical/20 text-critical border border-critical/40',
  HIGH: 'bg-high/20 text-high border border-high/40',
  MODERATE: 'bg-moderate/20 text-moderate border border-moderate/40',
};

export function UrgencyBadge({ urgency }: { urgency: IncidentUrgency }) {
  return <span className={`px-2 py-1 rounded-full text-[11px] font-mono uppercase ${classMap[urgency]}`}>{urgency}</span>;
}
