import { BaseMap } from '../../components/map/BaseMap';
import { IncidentMarker } from '../../components/map/IncidentMarker';
import { useIncidentStore } from '../../store/incidentStore';

export function ResponderMap() {
  const incidents = useIncidentStore((s) => s.incidents);
  return (
    <div className="h-[75vh] border border-border">
      <BaseMap center={{ lat: 22.9734, lng: 78.6569 }}>
        {incidents.map((i) => (
          <IncidentMarker key={i.id} incident={i} />
        ))}
      </BaseMap>
    </div>
  );
}
