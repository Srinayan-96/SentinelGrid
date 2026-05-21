import { api } from './client';
import type { Incident } from '../types';

export function getIncidents(params?: Record<string, string | number>) {
  return api.get<Incident[]>('/incidents', { params });
}

export function createIncident(payload: Record<string, unknown>) {
  return api.post<Incident>('/incidents', payload);
}
