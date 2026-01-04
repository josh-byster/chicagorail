/**
 * Hook for searching stations by name
 *
 * Features:
 * - Debounced input using useDeferredValue
 * - Minimum query length before searching
 * - Cached search results
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDeferredValue } from 'react';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG, APP_CONFIG } from '@/config';
import type { Stop } from '@chicagorail/shared';

export interface UseStationSearchResult {
  data: Stop[];
  isLoading: boolean;
  isFetching: boolean;
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
    // Keep showing previous results while fetching new ones
    placeholderData: keepPreviousData,
  });

  // Query meets min length but deferred value hasn't caught up yet
  const isPendingDeferred =
    query.length >= APP_CONFIG.search.minQueryLength &&
    deferredQuery.length < APP_CONFIG.search.minQueryLength;

  return {
    data: result.data?.stops ?? [],
    // isLoading: true on initial load OR when waiting for deferred value to enable query
    isLoading: (result.isLoading && !result.isPlaceholderData) || isPendingDeferred,
    // isFetching: true during any fetch (including background)
    isFetching: result.isFetching || query !== deferredQuery,
    isError: result.isError,
    error: result.error ? getErrorMessage(result.error) : null,
  };
}
