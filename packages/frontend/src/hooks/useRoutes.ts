import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Route } from '@chicagorail/shared';
import { useMemo } from 'react';

export function useRoutes() {
  const query = useQuery({
    queryKey: ['routes'],
    queryFn: () => api.getRoutes(),
    staleTime: 300000, // Routes rarely change, cache for 5 minutes
  });

  return {
    routes: query.data?.routes ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}

// Extract unique routes from departures data (for filtering by what's available at a stop)
export function useRoutesFromDepartures(stopId: string | null, date?: string) {
  const query = useQuery({
    queryKey: ['departures', stopId, undefined, date],
    queryFn: () => api.getDepartures(stopId!, undefined, date),
    enabled: !!stopId,
    staleTime: 30000,
  });

  const routes = useMemo(() => {
    if (!query.data?.departures) return [];
    const uniqueRoutes = new Map<string, Route>();
    query.data.departures.forEach(dep => {
      if (!uniqueRoutes.has(dep.route.route_id)) {
        uniqueRoutes.set(dep.route.route_id, dep.route);
      }
    });
    return Array.from(uniqueRoutes.values());
  }, [query.data?.departures]);

  return {
    routes,
    loading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
