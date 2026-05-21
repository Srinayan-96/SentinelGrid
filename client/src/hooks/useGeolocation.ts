import { useEffect, useState } from 'react';
import type { LatLng } from '../types';

interface GeoState {
  loading: boolean;
  coords: LatLng | null;
  accuracy: number | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    loading: true,
    coords: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ loading: false, coords: null, accuracy: null, error: 'Geolocation unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          loading: false,
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
        });
      },
      (err) => setState({ loading: false, coords: null, accuracy: null, error: err.message }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  return state;
}
