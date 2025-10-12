import { useQuery } from '@tanstack/react-query';
import { fetchReachableStations } from '@/services/api';
import type { Station } from '@metra/shared';

export function useReachableStations(originId: string | null) {
  return useQuery({
    queryKey: ['reachable-stations', originId],
    queryFn: async (): Promise<Station[]> => {
      if (!originId) return [];
      return fetchReachableStations(originId);
    },
    enabled: !!originId,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week - routes rarely change
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}
