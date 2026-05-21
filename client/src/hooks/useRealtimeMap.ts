import { useEffect } from 'react';
import { useIncidentStore } from '../store/incidentStore';
import { useSocket } from './useSocket';
import type { Incident } from '../types';

export function useRealtimeMap() {
  const socketRef = useSocket();
  const upsertIncident = useIncidentStore((s) => s.upsertIncident);
  const resolveIncident = useIncidentStore((s) => s.resolveIncident);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onNew = (payload: { incident: Incident }) => upsertIncident(payload.incident);
    const onUpdate = (payload: { incident: Incident }) => upsertIncident(payload.incident);
    const onResolved = (payload: { id: string; outcome?: { people_saved?: number } }) =>
      resolveIncident(payload.id, payload.outcome?.people_saved ?? 0);

    socket.on('incident:new', onNew);
    socket.on('incident:updated', onUpdate);
    socket.on('incident:resolved', onResolved);

    return () => {
      socket.off('incident:new', onNew);
      socket.off('incident:updated', onUpdate);
      socket.off('incident:resolved', onResolved);
    };
  }, [resolveIncident, socketRef, upsertIncident]);
}
