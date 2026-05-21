import { useBroadcastStore } from '../../store/broadcastStore';

function severityStyles(severity: 'INFO' | 'WARNING' | 'CRITICAL') {
  switch (severity) {
    case 'CRITICAL':
      return 'border-critical/50 bg-critical/10 text-critical';
    case 'WARNING':
      return 'border-high/50 bg-high/10 text-high';
    default:
      return 'border-accent/40 bg-accent/10 text-accent';
  }
}

export function TacticalAlerts() {
  const alerts = useBroadcastStore((s) => s.alerts);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((a) => (
        <div key={a.timestamp + a.message} className={`border p-2 font-mono text-xs ${severityStyles(a.severity)}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="tracking-wider">{a.severity}</span>
            <span className="text-gray-400">{new Date(a.timestamp).toLocaleTimeString()}</span>
          </div>
          {a.zone ? <div className="text-gray-300">ZONE: {a.zone}</div> : null}
          <div className="mt-1 whitespace-pre-wrap text-gray-200">{a.message}</div>
        </div>
      ))}
    </div>
  );
}

