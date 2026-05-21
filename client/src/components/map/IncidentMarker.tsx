import { Circle, CircleMarker, Popup } from 'react-leaflet';
import type { Incident } from '../../types';

const STYLE = {
  CRITICAL: { radius: 16, color: '#FF4444', fillOpacity: 0.85, pulseRadius: 34 },
  HIGH: { radius: 12, color: '#FF8C00', fillOpacity: 0.8, pulseRadius: 24 },
  MODERATE: { radius: 9, color: '#FFD700', fillOpacity: 0.75, pulseRadius: 18 },
  RESOLVED: { radius: 7, color: '#00FF88', fillOpacity: 0.5, pulseRadius: 14 },
} as const;

export function IncidentMarker({ incident }: { incident: Incident }) {
  const key = incident.status === 'RESOLVED' ? 'RESOLVED' : incident.urgency;
  const style = STYLE[key];
  return (
    <>
      {incident.status !== 'RESOLVED' && (
        <Circle
          center={[incident.location.lat, incident.location.lng]}
          pathOptions={{ color: style.color, opacity: 0.25 }}
          radius={style.pulseRadius * 60}
        />
      )}
      <CircleMarker
        center={[incident.location.lat, incident.location.lng]}
        radius={style.radius}
        pathOptions={{ color: style.color, fillColor: style.color, fillOpacity: style.fillOpacity, weight: 2 }}
      >
        <Popup>
          <div className="font-mono text-xs">
            <div>{incident.title}</div>
            <div>{incident.category} | {incident.urgency}</div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}
