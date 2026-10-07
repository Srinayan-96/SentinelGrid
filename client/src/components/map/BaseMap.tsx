import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import type { ReactNode } from 'react';
import type { LatLng } from '../../types';

interface Props {
  center: LatLng;
  zoom?: number;
  children?: ReactNode;
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

export function BaseMap({ center, zoom = 6, children }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  if (!isLoaded) return <div className="h-full w-full bg-bg flex items-center justify-center text-white">Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={{ lat: center.lat, lng: center.lng }}
      zoom={zoom}
      options={{
        styles: darkTheme,
        disableDefaultUI: true,
      }}
    >
      {children}
    </GoogleMap>
  );
}
