import { useQuery } from '@tanstack/react-query';
import { fetchTrains, fetchTrainDetail } from '@/services/api';
import { cacheTrains, getCachedTrains } from '@/services/storage';
import { CACHE_DURATION, INDEXEDDB_TTL, API_CONFIG } from '@/lib/constants';
import type { Train } from '@metra/shared';

interface UseTrainsParams {
  origin: string;
  destination: string;
  limit?: number;
  time?: string;
  date?: string;
  enabled?: boolean;
}

export function useTrains({
  origin,
  destination,
  limit,
  time,
  date,
  enabled = true,
}: UseTrainsParams) {
  return useQuery({
    queryKey: ['trains', origin, destination, limit, time, date],
    queryFn: async (): Promise<Train[]> => {
      try {
        // Try to fetch from API
        const trains = await fetchTrains({
          origin,
          destination,
          limit,
          time,
          date,
        });

        // Cache in IndexedDB
        await cacheTrains(trains);

        return trains;
      } catch (error) {
        // If API fails, try to get from cache
        const cached = await getCachedTrains(
          origin,
          destination,
          INDEXEDDB_TTL.TRAINS
        );

        if (cached) {
          return cached;
        }

        // Re-throw if no cache available
        throw error;
      }
    },
    enabled: enabled && !!origin && !!destination,
    staleTime: CACHE_DURATION.TRAINS,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: API_CONFIG.REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

export function useTrainDetail(tripId: string, enabled = true) {
  return useQuery({
    queryKey: ['train', tripId],
    queryFn: () => fetchTrainDetail(tripId),
    enabled: enabled && !!tripId,
    staleTime: CACHE_DURATION.TRAINS,
    gcTime: 5 * 60 * 1000,
    refetchInterval: API_CONFIG.REFETCH_INTERVAL,
  });
}
