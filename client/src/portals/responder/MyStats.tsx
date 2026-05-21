import { useQuery } from '@tanstack/react-query';
import { getKpis } from '../../api/analytics';
import { KPICard } from '../../components/ui/KPICard';

export function MyStats() {
  const { data } = useQuery({ queryKey: ['my-stats'], queryFn: async () => (await getKpis()).data });
  return (
    <div className="grid grid-cols-2 gap-3">
      <KPICard label="People Saved" value={data?.total_saved ?? 0} />
      <KPICard label="Resolved" value={data?.resolved ?? 0} />
    </div>
  );
}
