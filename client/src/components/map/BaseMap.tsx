import { MapContainer, TileLayer } from 'react-leaflet';
import type { ReactNode } from 'react';
import type { LatLng } from '../../types';
import 'leaflet/dist/leaflet.css';

interface Props {
  center: LatLng;
  zoom?: number;
  children?: ReactNode;
}

export function BaseMap({ center, zoom = 6, children }: Props) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full bg-bg">
      <TileLayer
        attribution="&copy; OpenStreetMap &copy; CartoDB"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {children}
    </MapContainer>
  );
}
