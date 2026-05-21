import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  token: null,
  setToken: (token) => set({ token }),
  
  incidents: [],
  setIncidents: (incidents) => set({ incidents }),
  addIncident: (incident) => set((state) => {
    const exists = state.incidents.find(i => String(i.id) === String(incident.id));
    if (exists) {
      // Update existing incident and maintain order
      return { 
        incidents: state.incidents.map(i => String(i.id) === String(incident.id) ? incident : i)
      };
    }
    // Add new incident to the top
    return { incidents: [incident, ...state.incidents] };
  }),

  responders: [],
  setResponders: (responders) => set({ responders }),
  
  activeIncidentId: null,
  setActiveIncidentId: (id) => set({ activeIncidentId: id }),
  
  focusedResponderId: null,
  setFocusedResponderId: (id) => set({ focusedResponderId: id }),
  
  broadcasts: [],
  addBroadcast: (msg) => set((state) => ({ broadcasts: [msg, ...state.broadcasts].slice(0, 10) })),

  location: [31.1471, 75.3412], // Initial fallback map center (Punjab)
  setLocation: (location) => set({ location })
}));
