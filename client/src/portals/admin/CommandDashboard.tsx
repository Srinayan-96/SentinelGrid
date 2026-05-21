import { useQuery } from '@tanstack/react-query';
import { getKpis } from '../../api/analytics';
import { KPICard } from '../../components/ui/KPICard';
import { PublicMap } from '../citizen/PublicMap';
import { useState } from 'react';
import { broadcastAlert } from '../../api/auth';

export function CommandDashboard() {
  const { data } = useQuery({ queryKey: ['kpis'], queryFn: async () => (await getKpis()).data });
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Active Incidents" value={data?.pending ?? 0} />
        <KPICard label="People Saved Today" value={data?.total_saved ?? 0} />
        <KPICard label="Responders Deployed" value={data?.resolved ?? 0} />
        <KPICard label="Avg Response Time (min)" value={Math.round(Number(data?.avg_response_time_min ?? 0))} />
      </div>
      <div className="border border-border bg-surface p-4">
        <div className="mb-2 font-mono text-xs text-gray-400">TACTICAL BROADCAST</div>
        <div className="flex gap-2">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="bg-bg border border-border text-xs font-mono text-white px-2 py-2 focus:outline-none focus:border-accent"
          >
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to all operators…"
            className="flex-1 border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <button
            disabled={busy || !message.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await broadcastAlert({ message: message.trim(), severity });
                setMessage('');
              } finally {
                setBusy(false);
              }
            }}
            className="border border-accent bg-accent/10 px-3 py-2 text-accent font-semibold hover:bg-accent hover:text-bg transition-all disabled:opacity-40"
          >
            {busy ? 'SENDING…' : 'SEND'}
          </button>
        </div>
      </div>
      <PublicMap />
    </div>
  );
}
