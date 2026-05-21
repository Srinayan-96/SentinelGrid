import { useEffect } from 'react';
import { BaseMap } from '../../components/map/BaseMap';
import { IncidentMarker } from '../../components/map/IncidentMarker';
import { useIncidentStore } from '../../store/incidentStore';
import { useRealtimeMap } from '../../hooks/useRealtimeMap';
import { getIncidents } from '../../api/incidents';

export function PublicMap() {
  // Enable real-time updates
  useRealtimeMap();

  const incidents = useIncidentStore((s) => s.incidents);
  const setIncidents = useIncidentStore((s) => s.setIncidents);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const { data } = await getIncidents();
        setIncidents(data);
      } catch (err) {
        console.error('Failed to fetch public map incidents:', err);
      }
    }
    fetchInitial();
  }, [setIncidents]);

  const center = incidents.length > 0 
    ? { lat: incidents[0].location.lat, lng: incidents[0].location.lng }
    : { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="h-[calc(100vh-8rem)] border border-border">
      <BaseMap center={center} zoom={incidents.length > 0 ? 6 : 5}>
        {incidents.map((i) => (
          <IncidentMarker key={i.id} incident={i} />
        ))}
      </BaseMap>
    </div>
  );
}
