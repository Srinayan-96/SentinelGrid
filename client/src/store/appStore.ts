import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  role: 'CITIZEN' | 'COMMAND' | 'RESPONDER';
  state: string;
  unit_name?: string;
  force_id?: string;
}

interface Incident {
  id: string;
  type: string;
  severity: string;
  description: string;
  people_affected: number;
  ai_urgency: string;
  ai_summary: string;
  ai_resources: string[];
  status: string;
  assigned_unit?: string;
  eta_minutes?: number;
  lat: number;
  lng: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  incidents: Incident[];
  activeIncidentId: string | null;
  
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (incident: Incident) => void;
  setActiveIncident: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      incidents: [],
      activeIncidentId: null,

      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, activeIncidentId: null }),
      setIncidents: (incidents) => set({ incidents }),
      addIncident: (incident) => set((state) => ({ 
        incidents: [incident, ...state.incidents.filter(i => i.id !== incident.id)] 
      })),
      updateIncident: (incident) => set((state) => ({
        incidents: state.incidents.map(i => i.id === incident.id ? incident : i)
      })),
      setActiveIncident: (id) => set({ activeIncidentId: id }),
    }),
    { name: 'sentinel-storage' }
  )
);
