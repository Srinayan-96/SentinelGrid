import { useState } from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import { IncidentCard } from '../../components/incidents/IncidentCard';
import { IncidentDetailPanel } from '../../components/incidents/IncidentDetailPanel';
import type { Incident } from '../../types';

export function MyReports() {
  const { data = [], refetch } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Find the latest version of the selected incident from the data array
  const activeIncident = data.find((i) => i.id === selectedIncident?.id) || selectedIncident;

  return (
    <div className="flex h-[calc(100vh-4rem)] border border-border bg-surface/50">
      {/* Master List (Left) */}
      <div className="w-1/3 border-r border-border overflow-y-auto p-4 space-y-2 bg-bg/30">
        <h2 className="text-sm font-bold text-gray-400 font-mono mb-3 tracking-wider">
          MY SOS REPORTS ({data.length})
        </h2>
        {data.length === 0 ? (
          <div className="text-sm text-gray-500 font-mono text-center py-8">
            [ NO REPORTS FILED ]
          </div>
        ) : (
          data.map((incident) => (
            <div
              key={incident.id}
              onClick={() => setSelectedIncident(incident)}
              className={`cursor-pointer transition-all ${
                activeIncident?.id === incident.id
                  ? 'ring-1 ring-accent bg-accent/5'
                  : 'hover:bg-surface'
              }`}
            >
              <IncidentCard incident={incident} />
            </div>
          ))
        )}
      </div>

      {/* Detail View (Right) */}
      <IncidentDetailPanel
        incident={activeIncident}
        onRefresh={() => {
          refetch();
        }}
      />
    </div>
  );
}
