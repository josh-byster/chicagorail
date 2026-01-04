import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDepartures(stopId: string | null, routeFilter?: string, date?: string) {
  const query = useQuery({
    queryKey: ['departures', stopId, routeFilter, date],
    queryFn: () => api.getDepartures(stopId!, routeFilter, date),
    enabled: !!stopId,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  return {
    stop: query.data?.stop ?? null,
    departures: query.data?.departures ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
