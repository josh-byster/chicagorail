/**
 * Centralized query key factory for TanStack Query
 *
 * Using a factory pattern ensures:
 * - Type safety for query keys
 * - Consistent key structure across the app
 * - Easy cache invalidation by prefix
 * - No typos in query key strings
 *
 * @example
 * // Single departure query
 * queryKeys.departures.byStop('OGILVIE')
 *
 * // Invalidate all departure queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.departures.all() })
 */

export const queryKeys = {
  /** Root key for all app queries */
  all: ['chicagorail'] as const,

  /** Route-related queries */
  routes: {
    all: () => [...queryKeys.all, 'routes'] as const,
    list: () => [...queryKeys.routes.all(), 'list'] as const,
  },

  /** Stop-related queries */
  stops: {
    all: () => [...queryKeys.all, 'stops'] as const,
    detail: (stopId: string) => [...queryKeys.stops.all(), 'detail', stopId] as const,
    search: (query: string) => [...queryKeys.stops.all(), 'search', query] as const,
  },

  /** Departure queries */
  departures: {
    all: () => [...queryKeys.all, 'departures'] as const,
    byStop: (stopId: string, options?: { date?: string; routeId?: string }) =>
      [...queryKeys.departures.all(), stopId, options ?? {}] as const,
  },

  /** Trip-related queries */
  trips: {
    all: () => [...queryKeys.all, 'trips'] as const,
    direct: (origin: string, destination: string, date?: string) =>
      [...queryKeys.trips.all(), 'direct', { origin, destination, date }] as const,
    details: (tripId: string, date?: string) =>
      [...queryKeys.trips.all(), 'details', tripId, { date }] as const,
  },

  /** System info queries */
  system: {
    all: () => [...queryKeys.all, 'system'] as const,
    info: () => [...queryKeys.system.all(), 'info'] as const,
  },
} as const;

/**
 * Type helper to extract query key types
 */
export type QueryKeys = typeof queryKeys;
