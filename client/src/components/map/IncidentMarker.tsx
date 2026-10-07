import { useState } from 'react';
import { Circle, InfoWindow } from '@react-google-maps/api';
import type { Incident } from '../../types';

const STYLE = {
  CRITICAL: { radius: 16000, color: '#FF4444', fillOpacity: 0.85, pulseRadius: 34000 },
  HIGH: { radius: 12000, color: '#FF8C00', fillOpacity: 0.8, pulseRadius: 24000 },
  MODERATE: { radius: 9000, color: '#FFD700', fillOpacity: 0.75, pulseRadius: 18000 },
  RESOLVED: { radius: 7000, color: '#00FF88', fillOpacity: 0.5, pulseRadius: 14000 },
} as const;

export function IncidentMarker({ incident }: { incident: Incident }) {
  const key = incident.status === 'RESOLVED' ? 'RESOLVED' : incident.urgency;
  const style = STYLE[key];
  const [activePopup, setActivePopup] = useState(false);

  return (
    <>
      {incident.status !== 'RESOLVED' && (
        <Circle
          center={{ lat: Number(incident.location.lat), lng: Number(incident.location.lng) }}
          radius={style.pulseRadius}
          options={{
            fillColor: style.color,
            fillOpacity: 0.25,
            strokeWeight: 0,
          }}
        />
      )}
      <Circle
        center={{ lat: Number(incident.location.lat), lng: Number(incident.location.lng) }}
        radius={style.radius}
        options={{
          fillColor: style.color,
          fillOpacity: style.fillOpacity,
          strokeColor: style.color,
          strokeWeight: 2,
        }}
        onClick={() => setActivePopup(true)}
      />
      
      {activePopup && (
        <InfoWindow
          position={{ lat: Number(incident.location.lat), lng: Number(incident.location.lng) }}
          onCloseClick={() => setActivePopup(false)}
        >
          <div className="font-mono text-xs text-slate-900">
            <div className="font-bold">{incident.title}</div>
            <div>{incident.category} | {incident.urgency}</div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
