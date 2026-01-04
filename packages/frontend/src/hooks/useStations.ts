import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useDeferredValue } from 'react';

export function useStationSearch(query: string) {
  // Defer the query value to avoid blocking UI during rapid typing
  const deferredQuery = useDeferredValue(query);

  const result = useQuery({
    queryKey: ['stations', 'search', deferredQuery],
    queryFn: () => api.searchStops(deferredQuery),
    enabled: deferredQuery.length >= 2,
    staleTime: 60000, // Cache search results for 1 minute
  });

  return {
    stops: result.data?.stops ?? [],
    loading: result.isLoading || query !== deferredQuery,
    error: result.error?.message ?? null,
  };
}
