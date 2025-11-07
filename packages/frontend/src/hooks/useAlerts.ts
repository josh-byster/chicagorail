import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '../services/api';
import type { ServiceAlert } from '@metra/shared';

interface UseAlertsOptions {
  lineId?: string;
  stationId?: string;
  refetchInterval?: number;
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const { lineId, stationId, refetchInterval = 30000 } = options;

  return useQuery<ServiceAlert[], Error>({
    queryKey: ['alerts', lineId, stationId],
    queryFn: () => fetchAlerts({ lineId, stationId }),
    refetchInterval,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });
}
