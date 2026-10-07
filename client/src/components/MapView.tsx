import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow, Circle } from '@react-google-maps/api';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  facilities?: any[];
  incidents?: any[];
  responderPos?: [number, number] | null;
  destinationPos?: [number, number] | null;
  onMapClick?: (lat: number, lng: number) => void;
}

const darkTheme = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

const MapView: React.FC<MapViewProps> = ({ 
  center = [20.5937, 78.9629], 
  zoom = 5, 
  facilities = [], 
  incidents = [],
  responderPos,
  destinationPos,
  onMapClick
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activePopup, setActivePopup] = useState<{lat: number, lng: number, content: React.ReactNode} | null>(null);

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

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && center) {
      map.panTo({ lat: center[0], lng: center[1] });
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);

  if (!isLoaded) return <div className="w-full h-full bg-[#0B0F1A] flex items-center justify-center text-white">Loading Map...</div>;

  return (
    <div className="w-full h-full relative bg-[#0B0F1A]">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={(e) => {
          if (onMapClick && e.latLng) {
            onMapClick(e.latLng.lat(), e.latLng.lng());
          }
        }}
        options={{
          styles: darkTheme,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* Facilities */}
        {facilities.map(f => (
          <Circle
            key={`fac-${f.id}`}
            center={{ lat: Number(f.lat), lng: Number(f.lng) }}
            radius={20000}
            options={{
              fillColor: typeColors[f.type] || '#fff',
              fillOpacity: 0.8,
              strokeColor: typeColors[f.type] || '#fff',
              strokeOpacity: 1,
              strokeWeight: 1,
            }}
            onClick={() => setActivePopup({
              lat: Number(f.lat),
              lng: Number(f.lng),
              content: (
                <div>
                  <div className="text-slate-900 font-bold">{f.name}</div>
                  <div className="text-slate-600 text-xs">{f.type} - {f.is_available ? 'AVAILABLE' : 'DEPLOYED'}</div>
                </div>
              )
            })}
          />
        ))}

        {/* Incidents */}
        {incidents.map(inc => (
          <Circle
            key={`inc-${inc.id}`}
            center={{ lat: Number(inc.lat), lng: Number(inc.lng) }}
            radius={inc.ai_urgency === 'CRITICAL' ? 50000 : 30000}
            options={{
              fillColor: urgencyColors[inc.ai_urgency] || '#FF3B3B',
              fillOpacity: 0.6,
              strokeColor: urgencyColors[inc.ai_urgency] || '#FF3B3B',
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
            onClick={() => setActivePopup({
              lat: Number(inc.lat),
              lng: Number(inc.lng),
              content: (
                <div>
                  <div className="text-slate-900 font-bold">{inc.type}</div>
                  <div className="text-slate-600 text-xs">{inc.ai_summary}</div>
                </div>
              )
            })}
          />
        ))}

        {/* Responder Tracking */}
        {responderPos && (
          <Circle 
            center={{ lat: responderPos[0], lng: responderPos[1] }}
            radius={15000}
            options={{
              fillColor: '#00FF00',
              fillOpacity: 0.9,
              strokeColor: '#00FF00',
              strokeWeight: 2,
            }}
          />
        )}

        {/* Route Line */}
        {responderPos && destinationPos && (
          <Polyline 
            path={[
              { lat: responderPos[0], lng: responderPos[1] },
              { lat: destinationPos[0], lng: destinationPos[1] }
            ]}
            options={{
              strokeColor: '#00D4FF',
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        )}

        {activePopup && (
          <InfoWindow
            position={{ lat: activePopup.lat, lng: activePopup.lng }}
            onCloseClick={() => setActivePopup(null)}
          >
            {activePopup.content}
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapView;
