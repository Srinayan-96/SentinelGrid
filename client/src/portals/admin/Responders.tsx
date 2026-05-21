import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { DataTable } from '../../components/ui/DataTable';
import type { User } from '../../types';

export function Responders() {
  const { data = [] } = useQuery({
    queryKey: ['responders'],
    queryFn: async () => (await api.get<User[]>('/users/responders')).data,
  });

  return (
    <DataTable
      rows={data}
      columns={[
        { key: 'name', title: 'Name', render: (row) => row.name },
        { key: 'force', title: 'Force ID', render: (row) => row.force_id ?? '-' },
        { key: 'unit', title: 'Unit', render: (row) => row.unit_name ?? '-' },
        { key: 'online', title: 'Online', render: (row) => (row.is_online ? 'ONLINE' : 'OFFLINE') },
        { key: 'missions', title: 'Missions', align: 'right', render: (row) => row.total_missions ?? 0 },
      ]}
    />
  );
}
