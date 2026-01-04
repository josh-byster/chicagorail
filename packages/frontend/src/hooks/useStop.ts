/**
 * Hook for fetching stop metadata
 *
 * Optimized to read from existing departures cache when possible,
 * avoiding redundant API calls.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG } from '@/config';
import type { Stop, GetDeparturesResponse } from '@chicagorail/shared';

export interface UseStopResult {
  data: Stop | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Get stop metadata, preferring cached data from departures queries
 *
 * Optimization: Before making a network request, checks if stop
 * data is already available in any departures query cache.
 *
 * @param stopId - Station ID to fetch (null to disable)
 */
export function useStop(stopId: string | null): UseStopResult {
  const queryClient = useQueryClient();

  // Try to find stop in any cached departures query
  // Note: queryClient is a stable reference from context, no need in deps
  const cachedStop = useMemo(() => {
    if (!stopId) return null;

    // Get all departures queries from cache
    const queries = queryClient.getQueriesData<GetDeparturesResponse>({
      queryKey: queryKeys.departures.all(),
    });

    // Find the stop in any of them
    for (const [, data] of queries) {
      if (data?.stop?.stop_id === stopId) {
        return data.stop;
      }
    }

    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopId]);

  // Only fetch if not in cache
  const query = useQuery({
    // Query key uses empty string as fallback - query won't execute when disabled
    queryKey: queryKeys.stops.detail(stopId ?? ''),
    queryFn: () => api.getDepartures(stopId!, { limit: 1 }),
    enabled: !!stopId && !cachedStop,
    staleTime: QUERY_CONFIG.staleTime.stops,
  });

  return {
    data: cachedStop ?? query.data?.stop ?? null,
    isLoading: !cachedStop && query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
