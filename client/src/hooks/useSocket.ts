import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user, addIncident, updateIncident } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const socket = io('/', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to SentinelGrid Network');
      socket.emit('join', { userId: user.id, role: user.role });
    });

    socket.on('incident:new', (incident) => {
      addIncident(incident);
    });

    socket.on('incident:updated', (incident) => {
      updateIncident(incident);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, addIncident, updateIncident]);

  return socketRef.current;
};
