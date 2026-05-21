import { create } from 'zustand';
import type { Incident } from '../types';

interface IncidentState {
  incidents: Incident[];
  setIncidents: (incidents: Incident[]) => void;
  upsertIncident: (incident: Incident) => void;
  resolveIncident: (id: string, peopleSaved?: number) => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: [],
  setIncidents: (incidents) => set({ incidents }),
  upsertIncident: (incident) =>
    set((state) => {
      const idx = state.incidents.findIndex((item) => item.id === incident.id);
      if (idx === -1) return { incidents: [incident, ...state.incidents] };
      const next = [...state.incidents];
      next[idx] = incident;
      return { incidents: next };
    }),
  resolveIncident: (id, peopleSaved = 0) =>
    set((state) => ({
      incidents: state.incidents.map((item) =>
        item.id === id ? { ...item, status: 'RESOLVED', people_saved: peopleSaved } : item
      ),
    })),
}));
