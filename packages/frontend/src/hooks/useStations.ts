/**
 * Hook for searching stations by name
 *
 * Features:
 * - Debounced input using useDeferredValue
 * - Minimum query length before searching
 * - Cached search results
 */

import { useQuery } from '@tanstack/react-query';
import { useDeferredValue } from 'react';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG, APP_CONFIG } from '@/config';
import type { Stop } from '@chicagorail/shared';

export interface UseStationSearchResult {
  data: Stop[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Search for stations by name with debouncing
 *
 * Uses React's useDeferredValue to prevent blocking UI during
 * rapid typing. Loading state reflects both pending defer and
 * actual network request.
 *
 * @param query - Search query string
 *
 * @example
 * const { data: stops, isLoading } = useStationSearch('ogilvie');
 */
export function useStationSearch(query: string): UseStationSearchResult {
  // Defer the query value to avoid blocking UI during rapid typing
  const deferredQuery = useDeferredValue(query);

  const result = useQuery({
    queryKey: queryKeys.stops.search(deferredQuery),
    queryFn: () => api.searchStops(deferredQuery),
    enabled: deferredQuery.length >= APP_CONFIG.search.minQueryLength,
    staleTime: QUERY_CONFIG.staleTime.search,
  });

  return {
    data: result.data?.stops ?? [],
    // Show loading when deferred value is pending OR query is loading
    isLoading: result.isLoading || query !== deferredQuery,
    isError: result.isError,
    error: result.error ? getErrorMessage(result.error) : null,
  };
}
