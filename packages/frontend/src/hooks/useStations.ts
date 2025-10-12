import { useQuery } from '@tanstack/react-query';
import { fetchStations } from '@/services/api';
import { cacheStations, getCachedStations } from '@/services/storage';
import type { Station } from '@metra/shared';

export function useStations(lineId?: string) {
  return useQuery({
    queryKey: ['stations', lineId],
    queryFn: async (): Promise<Station[]> => {
      try {
        // Try to fetch from API
        const stations = await fetchStations(lineId);

        // Cache in IndexedDB for offline access
        if (!lineId) {
          // Only cache all stations (not filtered results)
          await cacheStations(stations);
        }

        return stations;
      } catch (error) {
        // If API fails, try to get from cache
        const cached = await getCachedStations();

        if (cached.length > 0) {
          // Filter by line if needed
          if (lineId) {
            return cached.filter(s => s.lines_served.includes(lineId));
          }
          return cached;
        }

        // Re-throw if no cache available
        throw error;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week - stations rarely change
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}
