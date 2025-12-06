import { format } from 'date-fns';
import { Route, Stop, TripWithStops } from '@/types/metra';

const API_BASE_URL = import.meta.env.PROD
  ? 'https://metra-tracker.joshbyster.com/api'
  : 'http://localhost:3000/api';

// Simple in-memory cache
const routesCache: Route[] = [];
const tripsCache = new Map<string, TripWithStops[]>();
const stopSearchCache = new Map<string, { stops: Stop[]; routes: Route[] }>();

export const api = {
  /**
   * Get all Metra routes
   */
  async getRoutes(): Promise<Route[]> {
    try {
      // Return cached routes if available
      if (routesCache.length > 0) {
        console.log('[API] Routes cache hit');
        return routesCache;
      }

      console.log('[API] Fetching routes from backend');
      const response = await fetch(`${API_BASE_URL}/routes`);

      if (!response.ok) {
        throw new Error(`Failed to fetch routes: ${response.statusText}`);
      }

      const data: Route[] = await response.json();

      // Cache the routes
      routesCache.push(...data);
      console.log('[API] Routes fetched and cached');

      return data;
    } catch (error) {
      console.error('[API] Error fetching routes:', error);
      throw error;
    }
  },

  /**
   * Search for stops by name
   */
  async searchStops(query: string): Promise<{ stops: Stop[]; routes: Route[] }> {
    try {
      // Check cache first
      if (stopSearchCache.has(query)) {
        console.log('[API] Stop search cache hit for:', query);
        return stopSearchCache.get(query)!;
      }

      console.log('[API] Searching stops for:', query);
      const response = await fetch(
        `${API_BASE_URL}/search/stops?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to search stops: ${response.statusText}`);
      }

      const result = await response.json();

      // Cache the result
      stopSearchCache.set(query, result);

      return result;
    } catch (error) {
      console.error('[API] Error searching stops:', error);
      throw error;
    }
  },

  /**
   * Get trips for a specific route on a specific date
   */
  async getTrips(routeId: string, date: Date): Promise<TripWithStops[]> {
    try {
      // Format date as YYYY-MM-DD
      const dateStr = format(date, 'yyyy-MM-dd');
      const cacheKey = `${routeId}-${dateStr}`;

      // Check cache first
      if (tripsCache.has(cacheKey)) {
        console.log('[API] Trips cache hit for:', cacheKey);
        return tripsCache.get(cacheKey)!;
      }

      console.log('[API] Fetching trips for:', cacheKey);
      const response = await fetch(
        `${API_BASE_URL}/routes/${routeId}/trips?date=${dateStr}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch trips: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data: TripWithStops[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array of trips');
      }

      // Cache the result
      tripsCache.set(cacheKey, data);
      console.log('[API] Trips fetched and cached for:', cacheKey);

      return data;
    } catch (error) {
      console.error('[API] Error fetching trips:', error);
      throw error;
    }
  },

  /**
   * Clear the trips cache (useful when date changes)
   */
  clearTripsCache(): void {
    tripsCache.clear();
    console.log('[API] Trips cache cleared');
  },

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    routesCache.length = 0;
    tripsCache.clear();
    stopSearchCache.clear();
    console.log('[API] All caches cleared');
  },
};
