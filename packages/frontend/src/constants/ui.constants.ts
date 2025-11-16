/**
 * UI-related constants for consistent styling and layout
 */

/**
 * Dropdown and list heights
 */
export const DROPDOWN_HEIGHTS = {
  ORIGIN: '35vh',
  DESTINATION: '28vh',
  STATION_LIST: '400px',
} as const;

/**
 * Train list item dimensions
 */
export const TRAIN_LIST = {
  STOPS_MAX_HEIGHT: '64px',
  STOP_ITEM_HEIGHT: '32px',
} as const;

/**
 * Map-related constants
 */
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 11,
  DEFAULT_CENTER: {
    lat: 41.8781,
    lng: -87.6298,
  },
} as const;

/**
 * Animation and timing
 */
export const TIMING = {
  DEBOUNCE_SEARCH_MS: 300,
  TOAST_DURATION_MS: 3000,
  REFRESH_INTERVAL_MS: 30000, // 30 seconds
} as const;
