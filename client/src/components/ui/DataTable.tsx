import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

export function DataTable<T extends { id: string }>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  return (
    <table className="w-full border-collapse border border-border bg-surface text-sm">
      <thead>
        <tr className="border-b border-border">
          {columns.map((col) => (
            <th key={col.key} className={`px-3 py-2 font-mono text-xs text-gray-400 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border/50">
            {columns.map((col) => (
              <td key={col.key} className={`px-3 py-2 font-mono ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
