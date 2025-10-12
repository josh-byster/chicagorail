import { SavedRoute } from '@metra/shared';

/**
 * Saved Routes Service
 *
 * Client-side storage for saved routes using LocalStorage and IndexedDB
 * Provides CRUD operations for user's favorite routes
 */

const SAVED_ROUTES_KEY = 'metra_saved_routes';

/**
 * Get all saved routes from storage
 * @returns Array of saved routes
 */
export const getSavedRoutes = async (): Promise<SavedRoute[]> => {
  try {
    const savedRoutesJson = localStorage.getItem(SAVED_ROUTES_KEY);
    if (savedRoutesJson) {
      return JSON.parse(savedRoutesJson);
    }
    return [];
  } catch (error) {
    console.error('Error loading saved routes from localStorage:', error);
    return [];
  }
};

/**
 * Save a route to storage
 * @param route - The route to save
 * @returns Updated array of saved routes
 */
export const saveRoute = async (route: SavedRoute): Promise<SavedRoute[]> => {
  try {
    const savedRoutes = await getSavedRoutes();
    
    // Check if route already exists (by origin/destination)
    const existingIndex = savedRoutes.findIndex(
      r => r.origin_station_id === route.origin_station_id && 
           r.destination_station_id === route.destination_station_id
    );
    
    if (existingIndex >= 0) {
      // Update existing route
      savedRoutes[existingIndex] = {
        ...savedRoutes[existingIndex],
        ...route,
        last_used_at: new Date().toISOString(),
        use_count: (savedRoutes[existingIndex].use_count || 0) + 1,
      };
    } else {
      // Add new route
      savedRoutes.push({
        ...route,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        use_count: 1,
      });
    }
    
    localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(savedRoutes));
    return savedRoutes;
  } catch (error) {
    console.error('Error saving route to localStorage:', error);
    throw error;
  }
};

/**
 * Delete a saved route from storage
 * @param originId - Origin station ID
 * @param destinationId - Destination station ID
 * @returns Updated array of saved routes
 */
export const deleteRoute = async (
  originId: string,
  destinationId: string
): Promise<SavedRoute[]> => {
  try {
    const savedRoutes = await getSavedRoutes();
    const filteredRoutes = savedRoutes.filter(
      route => route.origin_station_id !== originId || 
               route.destination_station_id !== destinationId
    );
    
    localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(filteredRoutes));
    return filteredRoutes;
  } catch (error) {
    console.error('Error deleting route from localStorage:', error);
    throw error;
  }
};

/**
 * Get a specific saved route by origin and destination
 * @param originId - Origin station ID
 * @param destinationId - Destination station ID
 * @returns SavedRoute object or null if not found
 */
export const getSavedRoute = async (
  originId: string,
  destinationId: string
): Promise<SavedRoute | null> => {
  try {
    const savedRoutes = await getSavedRoutes();
    const route = savedRoutes.find(
      r => r.origin_station_id === originId && 
           r.destination_station_id === destinationId
    );
    return route || null;
  } catch (error) {
    console.error('Error getting saved route:', error);
    return null;
  }
};

/**
 * Update last used timestamp and use count for a route
 * @param originId - Origin station ID
 * @param destinationId - Destination station ID
 * @returns Updated array of saved routes
 */
export const updateLastUsed = async (
  originId: string,
  destinationId: string
): Promise<SavedRoute[]> => {
  try {
    const savedRoutes = await getSavedRoutes();
    const routeIndex = savedRoutes.findIndex(
      r => r.origin_station_id === originId && 
           r.destination_station_id === destinationId
    );
    
    if (routeIndex >= 0) {
      savedRoutes[routeIndex] = {
        ...savedRoutes[routeIndex],
        last_used_at: new Date().toISOString(),
        use_count: (savedRoutes[routeIndex].use_count || 0) + 1,
      };
      
      localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(savedRoutes));
    }
    
    return savedRoutes;
  } catch (error) {
    console.error('Error updating last used for route:', error);
    throw error;
  }
};
