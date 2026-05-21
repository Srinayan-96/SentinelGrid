import { CircleMarker, Tooltip } from 'react-leaflet';
import type { User } from '../../types';

export function ResponderDot({ responder }: { responder: User }) {
  if (!responder.location) return null;
  return (
    <CircleMarker
      center={[responder.location.lat, responder.location.lng]}
      radius={8}
      pathOptions={{ color: '#00D4FF', fillColor: '#00D4FF', fillOpacity: 0.9, weight: 2 }}
    >
      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
        <span className="font-mono text-xs">{responder.force_id || responder.name}</span>
      </Tooltip>
    </CircleMarker>
  );
}
