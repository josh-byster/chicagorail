/**
 * Application-wide constants and configuration values.
 * Centralizes magic numbers and configuration for easier maintenance.
 */

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  /** 30 seconds - for realtime train data */
  TRAINS: 30 * 1000,
  /** 1 week - for static station data */
  STATIONS: 7 * 24 * 60 * 60 * 1000,
  /** 1 week - for static line data */
  LINES: 7 * 24 * 60 * 60 * 1000,
  /** 30 days - garbage collection time */
  GC_TIME: 30 * 24 * 60 * 60 * 1000,
} as const;

// IndexedDB cache TTL
export const INDEXEDDB_TTL = {
  /** 30 seconds - for cached trains */
  TRAINS: 30 * 1000,
  /** 60 seconds - stale train cleanup threshold */
  STALE_TRAINS: 60 * 1000,
} as const;

// API configuration
export const API_CONFIG = {
  /** Number of retry attempts for failed API calls */
  RETRY_COUNT: 3,
  /** Auto-refetch interval for trains (30 seconds) */
  REFETCH_INTERVAL: 30 * 1000,
} as const;

// UI constants
export const UI_CONSTANTS = {
  /** Maximum number of trains to fetch per request */
  DEFAULT_TRAIN_LIMIT: 10,
  /** Animation delay increment (ms) */
  ANIMATION_DELAY_INCREMENT: 100,
  /** Maximum animation delay (ms) */
  MAX_ANIMATION_DELAY: 300,
} as const;

// LocalStorage keys
export const STORAGE_KEYS = {
  SAVED_ROUTES: 'metra_saved_routes',
} as const;
