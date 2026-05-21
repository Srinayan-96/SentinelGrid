import { api } from './client';
import type { User, UserRole } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export function register(payload: {
  name: string;
  email: string;
  password: string;
  role: Extract<UserRole, 'CITIZEN' | 'RESPONDER'>;
  force_id?: string;
  unit_name?: string;
  skills?: string[];
}) {
  return api.post<{ user: User }>('/auth/register', payload);
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password });
}

export function logout() {
  return api.post('/auth/logout');
}

export function broadcastAlert(payload: { message: string; severity?: 'INFO' | 'WARNING' | 'CRITICAL'; zone?: string }) {
  return api.post('/auth/broadcast', payload);
}
