/**
 * Hook for fetching system information
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG } from '@/config';

export interface UseSystemInfoResult {
  data: {
    lastUpdated: string | null;
  };
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Get system information (last GTFS update, etc.)
 *
 * Used in footer to show data freshness.
 */
export function useSystemInfo(): UseSystemInfoResult {
  const result = useQuery({
    queryKey: queryKeys.system.info(),
    queryFn: () => api.getSystemInfo(),
    staleTime: QUERY_CONFIG.staleTime.system,
  });

  return {
    data: {
      lastUpdated: result.data?.lastUpdated ?? null,
    },
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error ? getErrorMessage(result.error) : null,
  };
}
