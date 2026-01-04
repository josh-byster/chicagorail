import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useSystemInfo() {
  const result = useQuery({
    queryKey: ['system', 'info'],
    queryFn: () => api.getSystemInfo(),
    staleTime: 300000, // Cache for 5 minutes
  });

  return {
    lastUpdated: result.data?.lastUpdated ?? null,
    loading: result.isLoading,
    error: result.error?.message ?? null,
  };
}
