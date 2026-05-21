import { api } from './client';

export function getKpis() {
  return api.get('/analytics/kpis');
}
