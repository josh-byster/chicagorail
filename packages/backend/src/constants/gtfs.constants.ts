/**
 * GTFS-related constants
 */

/**
 * Default route colors used when GTFS data doesn't specify colors
 */
export const DEFAULT_ROUTE_COLORS = {
  BACKGROUND: '#CCCCCC' as string,
  TEXT_ON_LIGHT: '#000000' as string,
  TEXT_ON_DARK: '#FFFFFF' as string,
};

/**
 * Cache configuration for GTFS services
 */
export const CACHE_CONFIG = {
  MAX_SIZE: 1000,
  CLEANUP_INTERVAL_MS: 60000, // 60 seconds
  DEFAULT_TTL_MS: 30000, // 30 seconds
} as const;

/**
 * Station detection tolerances
 */
export const STATION_DETECTION = {
  BEARING_TOLERANCE_DEGREES: 45,
  DISTANCE_THRESHOLD_METERS: 100,
} as const;
