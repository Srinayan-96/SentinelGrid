import { create } from 'zustand';
import type { LatLng } from '../types';

interface MapState {
  center: LatLng;
  zoom: number;
  setViewport: (center: LatLng, zoom: number) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: 22.9734, lng: 78.6569 },
  zoom: 5,
  setViewport: (center, zoom) => set({ center, zoom }),
}));
