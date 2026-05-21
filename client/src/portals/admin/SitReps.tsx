import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

export function SitReps() {
  const { data = [] } = useQuery({
    queryKey: ['sitreps'],
    queryFn: async () => (await api.get('/sitreps')).data,
  });
  return (
    <div className="space-y-2">
      {data.map((row: { id: string; created_at: string; zone: string; report_text: string }) => (
        <article key={row.id} className="border border-border bg-surface p-3">
          <div className="font-mono text-xs text-gray-400">{row.created_at} | {row.zone}</div>
          <p className="mt-2 whitespace-pre-wrap font-mono text-sm">{row.report_text}</p>
        </article>
      ))}
    </div>
  );
}
