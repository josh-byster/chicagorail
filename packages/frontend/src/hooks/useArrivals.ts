/**
 * Hook for fetching arrivals into a station
 *
 * The mirror of useDepartures, for when you name where you're going but
 * not where you're coming from.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG } from '@/config';
import type { Stop, Arrival } from '@chicagorail/shared';

export interface UseArrivalsOptions {
  routeId?: string;
  date?: string;
}

export interface UseArrivalsResult {
  data: {
    stop: Stop | null;
    arrivals: Arrival[];
  };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: string | null;
  /** Epoch ms of the last successful fetch, for the "updated Ns ago" line */
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useArrivals(
  stopId: string | null,
  options?: UseArrivalsOptions
): UseArrivalsResult {
  const query = useQuery({
    // Query key uses empty string as fallback - query won't execute when disabled
    queryKey: queryKeys.arrivals.byStop(stopId ?? '', {
      date: options?.date,
      routeId: options?.routeId,
    }),
    queryFn: () =>
      api.getArrivals(stopId!, {
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
      arrivals: query.data?.arrivals ?? [],
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    dataUpdatedAt: query.dataUpdatedAt,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}
