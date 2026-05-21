import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DataTable } from '../../components/ui/DataTable';

interface ForceRow {
  id: string;
  force_id: string;
  incidents: number;
  people_saved: number;
}

export function Forces() {
  const { data = [] } = useQuery({
    queryKey: ['forces'],
    queryFn: async () => (await api.get<Omit<ForceRow, 'id'>[]>('/analytics/forces')).data,
  });

  const rows: ForceRow[] = data.map((row, index) => ({ ...row, id: `${row.force_id}-${index}` }));
  return (
    <DataTable
      rows={rows}
      columns={[
        { key: 'force_id', title: 'Force ID', render: (row) => row.force_id },
        { key: 'incidents', title: 'Incidents', align: 'right', render: (row) => row.incidents },
        { key: 'people_saved', title: 'People Saved', align: 'right', render: (row) => row.people_saved },
      ]}
    />
  );
}
