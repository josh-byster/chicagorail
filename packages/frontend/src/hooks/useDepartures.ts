/**
 * Hook for fetching departures from a station
 *
 * Features:
 * - Auto-refresh every 30 seconds
 * - Caches stop metadata for route extraction
 * - Consistent error handling
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG } from '@/config';
import type { Stop, Departure } from '@chicagorail/shared';

export interface UseDeparturesOptions {
  routeId?: string;
  date?: string;
}

export interface UseDeparturesResult {
  data: {
    stop: Stop | null;
    departures: Departure[];
  };
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch departures from a station with auto-refresh
 *
 * @param stopId - Station ID to fetch departures for (null to disable)
 * @param options - Optional route filter and date
 *
 * @example
 * const { data, isLoading, error } = useDepartures('OGILVIE', { date: '2024-01-15' });
 */
export function useDepartures(
  stopId: string | null,
  options?: UseDeparturesOptions
): UseDeparturesResult {
  const query = useQuery({
    // Query key uses empty string as fallback - query won't execute when disabled
    queryKey: queryKeys.departures.byStop(stopId ?? '', {
      date: options?.date,
      routeId: options?.routeId,
    }),
    queryFn: () =>
      api.getDepartures(stopId!, {
        routeId: options?.routeId,
        date: options?.date,
      }),
    enabled: !!stopId,
    refetchInterval: QUERY_CONFIG.refetchInterval.departures,
    staleTime: QUERY_CONFIG.staleTime.departures,
  });

  return {
    data: {
      stop: query.data?.stop ?? null,
      departures: query.data?.departures ?? [],
    },
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}
