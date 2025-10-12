import { useQuery } from '@tanstack/react-query';
import { fetchTrains, fetchTrainDetail } from '@/services/api';
import { cacheTrains, getCachedTrains } from '@/services/storage';
import type { Train } from '@metra/shared';

interface UseTrainsParams {
  origin: string;
  destination: string;
  limit?: number;
  time?: string;
  date?: string;
  enabled?: boolean;
}

export function useTrains({ origin, destination, limit, time, enabled = true }: UseTrainsParams) {
  return useQuery({
    queryKey: ['trains', origin, destination, limit, time],
    queryFn: async (): Promise<Train[]> => {
      try {
        // Try to fetch from API
        const trains = await fetchTrains({ origin, destination, limit, time });

        // Cache in IndexedDB
        await cacheTrains(trains);

        return trains;
      } catch (error) {
        // If API fails, try to get from cache (30s TTL)
        const cached = await getCachedTrains(origin, destination, 30000);

        if (cached) {
          return cached;
        }

        // Re-throw if no cache available
        throw error;
      }
    },
    enabled: enabled && !!origin && !!destination,
    staleTime: 30 * 1000, // 30 seconds - matches realtime update interval
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useTrainDetail(tripId: string, enabled = true) {
  return useQuery({
    queryKey: ['train', tripId],
    queryFn: () => fetchTrainDetail(tripId),
    enabled: enabled && !!tripId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}
