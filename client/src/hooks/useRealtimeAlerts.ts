import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useBroadcastStore, type TacticalAlert } from '../store/broadcastStore';

export function useRealtimeAlerts() {
  const socketRef = useSocket();
  const addAlert = useBroadcastStore((s) => s.addAlert);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onAlert = (payload: TacticalAlert) => addAlert(payload);
    socket.on('zone:alert', onAlert);

    return () => {
      socket.off('zone:alert', onAlert);
    };
  }, [addAlert, socketRef]);
}

