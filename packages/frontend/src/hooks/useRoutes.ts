/**
 * Hooks for fetching route data
 *
 * Provides two hooks:
 * - useRoutes: Fetch all Metra routes
 * - useRoutesFromDepartures: Extract routes from cached departures data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/lib/api';
import { queryKeys, getErrorMessage } from '@/shared/lib';
import { QUERY_CONFIG } from '@/config';
import type { Route, GetDeparturesResponse } from '@chicagorail/shared';

export interface UseRoutesResult {
  data: Route[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Fetch all Metra routes
 *
 * Routes rarely change, so we cache aggressively.
 */
export function useRoutes(): UseRoutesResult {
  const query = useQuery({
    queryKey: queryKeys.routes.list(),
    queryFn: () => api.getRoutes(),
    staleTime: QUERY_CONFIG.staleTime.routes,
  });

  return {
    data: query.data?.routes ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}

/**
 * Extract unique routes from existing departures cache
 *
 * This avoids a redundant API call by reading from the departures
 * data that's already been fetched. Falls back to loading state
 * if departures haven't been fetched yet.
 *
 * @param stopId - Station ID to get routes for
 * @param date - Optional date to match cached query
 */
export function useRoutesFromDepartures(
  stopId: string | null,
  date?: string
): UseRoutesResult {
  const queryClient = useQueryClient();

  // Read from the departures cache instead of making a new request
  const cachedData = stopId
    ? queryClient.getQueryData<GetDeparturesResponse>(
        queryKeys.departures.byStop(stopId, { date })
      )
    : null;

  const routes = useMemo(() => {
    if (!cachedData?.departures) return [];

    const uniqueRoutes = new Map<string, Route>();
    cachedData.departures.forEach((dep) => {
      if (!uniqueRoutes.has(dep.route.route_id)) {
        uniqueRoutes.set(dep.route.route_id, dep.route);
      }
    });

    return Array.from(uniqueRoutes.values());
  }, [cachedData?.departures]);

  return {
    data: routes,
    isLoading: !cachedData && !!stopId,
    isError: false,
    error: null,
  };
}
