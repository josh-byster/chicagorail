import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDirectTrips(
  originStopId: string | null,
  destinationStopId: string | null,
  date?: string
) {
  const query = useQuery({
    queryKey: ['trips', 'direct', originStopId, destinationStopId, date],
    queryFn: () => api.findDirectTrips(originStopId!, destinationStopId!, date, 50),
    enabled: !!originStopId && !!destinationStopId,
    staleTime: 30000,
  });

  return {
    trips: query.data?.trips ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
