import { create } from 'zustand';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface TacticalAlert {
  message: string;
  severity: AlertSeverity;
  zone: string | null;
  actor_id?: string;
  timestamp: string;
}

interface BroadcastState {
  alerts: TacticalAlert[];
  addAlert: (alert: TacticalAlert) => void;
  clear: () => void;
}

export const useBroadcastStore = create<BroadcastState>((set) => ({
  alerts: [],
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 20),
    })),
  clear: () => set({ alerts: [] }),
}));

