import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  facilities?: any[];
  incidents?: any[];
  responderPos?: [number, number] | null;
  destinationPos?: [number, number] | null;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ 
  center = [20.5937, 78.9629], 
  zoom = 5, 
  facilities = [], 
  incidents = [],
  responderPos,
  destinationPos
}) => {
  const urgencyColors: Record<string, string> = {
    CRITICAL: '#FF3B3B',
    HIGH: '#FF8C00',
    MODERATE: '#FFD700',
  };

  const typeColors: Record<string, string> = {
    NDRF: '#00D4FF',
    HOSPITAL: '#00FF88',
    FIRE: '#FF8C00',
    POLICE: '#4488FF',
  };

  return (
    <div className="w-full h-full relative bg-[#0B0F1A]">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <MapController center={center} zoom={zoom} />
        
        {/* Facilities */}
        {facilities.map(f => (
          <CircleMarker 
            key={f.id}
            center={[f.lat, f.lng]}
            radius={6}
            pathOptions={{ color: typeColors[f.type] || '#fff', fillOpacity: 0.8 }}
          >
            <Popup>
              <div className="text-slate-900 font-bold">{f.name}</div>
              <div className="text-slate-600 text-xs">{f.type} - {f.is_available ? 'AVAILABLE' : 'DEPLOYED'}</div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Incidents */}
        {incidents.map(inc => (
          <CircleMarker
            key={inc.id}
            center={[inc.lat, inc.lng]}
            radius={inc.ai_urgency === 'CRITICAL' ? 12 : 8}
            pathOptions={{ 
              color: urgencyColors[inc.ai_urgency] || '#FF3B3B', 
              fillOpacity: 0.6,
              weight: 2
            }}
            className="pulse-animation"
          >
            <Popup>
              <div className="font-bold">{inc.type}</div>
              <div className="text-xs">{inc.ai_summary}</div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Responder Tracking */}
        {responderPos && (
          <CircleMarker 
            center={responderPos}
            radius={8}
            pathOptions={{ color: '#00FF00', fillOpacity: 0.9 }}
          />
        )}

        {/* Route Line */}
        {responderPos && destinationPos && (
          <Polyline 
            positions={[responderPos, destinationPos]}
            pathOptions={{ color: '#00D4FF', weight: 3, dashArray: '8, 6', opacity: 0.8 }}
          />
        )}
      </MapContainer>

      <style dangerouslySetInnerHTML={{ __html: `
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { stroke-width: 2; opacity: 0.6; }
          50% { stroke-width: 8; opacity: 0.3; }
          100% { stroke-width: 2; opacity: 0.6; }
        }
      `}} />
    </div>
  );
};

export default MapView;
