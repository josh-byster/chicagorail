/**
 * Hook for fetching a single trip's stop-by-stop schedule
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG } from '@/config';
import type { GetTripDetailsResponse } from '@chicagorail/shared';

export interface UseTripDetailsResult {
  data: GetTripDetailsResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useTripDetails(tripId: string | null, date?: string): UseTripDetailsResult {
  const query = useQuery({
    // Query key uses empty string as fallback - query won't execute when disabled
    queryKey: queryKeys.trips.details(tripId ?? '', date),
    queryFn: () => api.getTripDetails(tripId!, date),
    enabled: !!tripId,
    staleTime: QUERY_CONFIG.staleTime.trips,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
