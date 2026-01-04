/**
 * Application-level configuration constants
 */

export const APP_CONFIG = {
  /** Limit settings */
  limits: {
    /** Maximum recent stops to store in localStorage */
    maxRecentStops: 5,

    /** Default number of departures to fetch */
    defaultDeparturesLimit: 100,

    /** Default number of trips to fetch */
    defaultTripsLimit: 50,
  },

  /** Search configuration */
  search: {
    /** Minimum characters before triggering search */
    minQueryLength: 2,
  },

  /** LocalStorage keys */
  storage: {
    recentStops: 'chicagorail:recent-stops',
  },

  /** Date format strings (date-fns compatible) */
  dateFormats: {
    /** URL parameter format */
    url: 'yyyy-MM-dd',

    /** Human-readable display */
    display: 'EEEE, MMMM d',

    /** Date picker display */
    datePicker: 'MMM d, yyyy',
  },
} as const;
