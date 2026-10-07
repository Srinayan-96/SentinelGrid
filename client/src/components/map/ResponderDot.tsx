import { useState } from 'react';
import { Circle, InfoWindow } from '@react-google-maps/api';
import type { User } from '../../types';

export function ResponderDot({ responder }: { responder: User }) {
  const [activePopup, setActivePopup] = useState(false);
  if (!responder.location) return null;

  return (
    <>
      <Circle
        center={{ lat: responder.location.lat, lng: responder.location.lng }}
        radius={15000}
        options={{
          fillColor: '#00D4FF',
          fillOpacity: 0.9,
          strokeColor: '#00D4FF',
          strokeWeight: 2,
        }}
        onClick={() => setActivePopup(true)}
      />
      {activePopup && (
        <InfoWindow
          position={{ lat: responder.location.lat, lng: responder.location.lng }}
          onCloseClick={() => setActivePopup(false)}
        >
          <span className="font-mono text-xs text-slate-900">{responder.force_id || responder.name}</span>
        </InfoWindow>
      )}
    </>
  );
}
