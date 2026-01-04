import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Stop } from '@chicagorail/shared';

interface UseStopResult {
  stop: Stop | null;
  loading: boolean;
  error: string | null;
}

export function useStop(stopId: string | null): UseStopResult {
  const query = useQuery({
    queryKey: ['stop', stopId],
    queryFn: () => api.getDepartures(stopId!, undefined, undefined, 1),
    enabled: !!stopId,
    staleTime: 300000, // Stop metadata rarely changes, cache for 5 minutes
  });

  return {
    stop: query.data?.stop ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
