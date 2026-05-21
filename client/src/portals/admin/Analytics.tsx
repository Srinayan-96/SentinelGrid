import { useQuery } from '@tanstack/react-query';
import { getKpis } from '../../api/analytics';
import { KPICard } from '../../components/ui/KPICard';

export function Analytics() {
  const { data } = useQuery({ queryKey: ['analytics-kpis'], queryFn: async () => (await getKpis()).data });
  return (
    <div className="grid grid-cols-4 gap-3">
      <KPICard label="Total Saved" value={data?.total_saved ?? 0} />
      <KPICard label="Resolved" value={data?.resolved ?? 0} />
      <KPICard label="Pending" value={data?.pending ?? 0} />
      <KPICard label="Avg Response (min)" value={Math.round(Number(data?.avg_response_time_min ?? 0))} />
    </div>
  );
}
