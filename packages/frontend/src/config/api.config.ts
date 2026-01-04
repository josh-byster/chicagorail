/**
 * API configuration constants
 */

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',

  endpoints: {
    routes: '/routes',
    stopsSearch: '/stops/search',
    departures: (stopId: string) => `/stops/${stopId}/departures`,
    directTrips: '/trips/direct',
    tripDetails: (tripId: string) => `/trips/${encodeURIComponent(tripId)}`,
    system: '/system',
  },

  defaults: {
    departuresLimit: 100,
    tripsLimit: 10,
  },

  timeout: 30_000, // 30 seconds
} as const;
