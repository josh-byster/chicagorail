/**
 * TanStack Query configuration constants
 *
 * Centralized timing configuration for all queries.
 * staleTime: How long data is considered fresh (won't refetch on mount)
 * refetchInterval: Auto-refresh interval for real-time data
 */

export const QUERY_CONFIG = {
  staleTime: {
    /** Routes rarely change - cache for 5 minutes */
    routes: 5 * 60 * 1000,

    /** Stop metadata is stable - cache for 5 minutes */
    stops: 5 * 60 * 1000,

    /** Departures are time-sensitive - consider stale after 10 seconds */
    departures: 10 * 1000,

    /** Trip results - 30 seconds */
    trips: 30 * 1000,

    /** Search results - cache for 1 minute */
    search: 60 * 1000,

    /** System info - cache for 5 minutes */
    system: 5 * 60 * 1000,
  },

  refetchInterval: {
    /** Auto-refresh departures every 30 seconds */
    departures: 30 * 1000,
  },

  /** Default query client options */
  defaults: {
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  },
} as const;
