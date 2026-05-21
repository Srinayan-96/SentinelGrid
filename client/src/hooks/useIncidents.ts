import { useQuery } from '@tanstack/react-query';
import { getIncidents } from '../api/incidents';

export function useIncidents(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: async () => (await getIncidents(params)).data,
  });
}
