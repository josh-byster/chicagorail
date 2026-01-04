/**
 * Hook for fetching direct trips between two stations
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG, APP_CONFIG } from '@/config';
import type { DirectTrip } from '@chicagorail/shared';

export interface UseDirectTripsResult {
  data: DirectTrip[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Find direct trips between two stations
 *
 * Only enabled when both origin and destination are provided.
 *
 * @param originStopId - Origin station ID (null to disable)
 * @param destinationStopId - Destination station ID (null to disable)
 * @param date - Optional date filter
 *
 * @example
 * const { data: trips, isLoading } = useDirectTrips('OGILVIE', 'RAVENSWOOD');
 */
export function useDirectTrips(
  originStopId: string | null,
  destinationStopId: string | null,
  date?: string
): UseDirectTripsResult {
  const query = useQuery({
    queryKey: queryKeys.trips.direct(originStopId!, destinationStopId!, date),
    queryFn: () =>
      api.findDirectTrips(originStopId!, destinationStopId!, {
        date,
        limit: APP_CONFIG.limits.defaultTripsLimit,
      }),
    enabled: !!originStopId && !!destinationStopId,
    staleTime: QUERY_CONFIG.staleTime.trips,
  });

  return {
    data: query.data?.trips ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}
