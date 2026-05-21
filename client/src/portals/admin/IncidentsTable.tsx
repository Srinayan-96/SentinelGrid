import { useIncidents } from '../../hooks/useIncidents';
import { DataTable } from '../../components/ui/DataTable';

export function IncidentsTable() {
  const { data = [] } = useIncidents();
  return (
    <DataTable
      rows={data}
      columns={[
        { key: 'id', title: 'ID', render: (row) => row.id.slice(0, 8) },
        { key: 'category', title: 'Category', render: (row) => row.category },
        { key: 'urgency', title: 'Urgency', render: (row) => row.urgency },
        { key: 'status', title: 'Status', render: (row) => row.status },
        { key: 'people_saved', title: 'People Saved', align: 'right', render: (row) => row.people_saved },
      ]}
    />
  );
}
