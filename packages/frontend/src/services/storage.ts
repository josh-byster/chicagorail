import Dexie, { Table } from 'dexie';
import type { Station, Line, Train, SavedRoute } from '@metra/shared';
import { INDEXEDDB_TTL } from '@/lib/constants';

export interface CachedTrain extends Train {
  cached_at: number; // Timestamp
}

// Re-export SavedRoute for convenience
export type { SavedRoute };

class MetraDB extends Dexie {
  stations!: Table<Station, string>;
  lines!: Table<Line, string>;
  trains!: Table<CachedTrain, string>;
  savedRoutes!: Table<SavedRoute, string>;

  constructor() {
    super('MetraDB');

    this.version(1).stores({
      stations: 'station_id, station_name, *lines_served',
      lines: 'line_id, line_short_name',
      trains:
        'trip_id, line_id, origin_station_id, destination_station_id, cached_at',
      savedRoutes:
        'route_id, origin_station_id, destination_station_id, last_used_at',
    });
  }
}

export const db = new MetraDB();

// Station storage helpers
export async function cacheStations(stations: Station[]): Promise<void> {
  await db.stations.bulkPut(stations);
}

export async function getCachedStations(): Promise<Station[]> {
  return db.stations.toArray();
}

export async function getCachedStation(
  stationId: string
): Promise<Station | undefined> {
  return db.stations.get(stationId);
}

// Line storage helpers
export async function cacheLines(lines: Line[]): Promise<void> {
  await db.lines.bulkPut(lines);
}

export async function getCachedLines(): Promise<Line[]> {
  return db.lines.toArray();
}

// Train storage helpers (with TTL)
export async function cacheTrains(trains: Train[]): Promise<void> {
  const cachedTrains: CachedTrain[] = trains.map((train) => ({
    ...train,
    cached_at: Date.now(),
  }));

  await db.trains.bulkPut(cachedTrains);
}

export async function getCachedTrains(
  originId: string,
  destinationId: string,
  maxAge = INDEXEDDB_TTL.TRAINS
): Promise<Train[] | null> {
  const now = Date.now();
  const trains = await db.trains
    .where('origin_station_id')
    .equals(originId)
    .and(
      (train) =>
        train.destination_station_id === destinationId &&
        now - train.cached_at < maxAge
    )
    .toArray();

  if (trains.length === 0) return null;

  // Remove cached_at before returning
  return trains.map(({ cached_at: _cached_at, ...train }) => train);
}

// Clear old cached trains
export async function clearStaleTrains(
  maxAge = INDEXEDDB_TTL.STALE_TRAINS
): Promise<void> {
  const cutoff = Date.now() - maxAge;
  await db.trains.where('cached_at').below(cutoff).delete();
}

// Saved Routes helpers
/**
 * Get all saved routes from IndexedDB
 * Sorted by last_used_at in descending order
 */
export async function getSavedRoutes(): Promise<SavedRoute[]> {
  return db.savedRoutes.orderBy('last_used_at').reverse().toArray();
}

/**
 * Save a new route or update an existing one
 * If route with same origin/destination exists, updates it instead
 */
export async function saveRoute(route: SavedRoute): Promise<SavedRoute[]> {
  const savedRoutes = await getSavedRoutes();

  // Check if route already exists (by origin/destination)
  const existingRoute = savedRoutes.find(
    (r) =>
      r.origin_station_id === route.origin_station_id &&
      r.destination_station_id === route.destination_station_id
  );

  if (existingRoute) {
    // Update existing route
    await db.savedRoutes.update(existingRoute.route_id, {
      ...existingRoute,
      ...route,
      last_used_at: new Date().toISOString(),
      use_count: (existingRoute.use_count || 0) + 1,
    });
  } else {
    // Add new route with generated ID
    const newRoute: SavedRoute = {
      ...route,
      route_id: route.route_id || crypto.randomUUID(),
      created_at: route.created_at || new Date().toISOString(),
      last_used_at: route.last_used_at || new Date().toISOString(),
      use_count: route.use_count || 1,
    };
    await db.savedRoutes.put(newRoute);
  }

  return getSavedRoutes();
}

/**
 * Delete a saved route by origin and destination IDs
 */
export async function deleteRoute(
  originId: string,
  destinationId: string
): Promise<SavedRoute[]> {
  const route = await db.savedRoutes
    .where('origin_station_id')
    .equals(originId)
    .and((r) => r.destination_station_id === destinationId)
    .first();

  if (route) {
    await db.savedRoutes.delete(route.route_id);
  }

  return getSavedRoutes();
}

/**
 * Get a specific saved route by origin and destination
 */
export async function getSavedRoute(
  originId: string,
  destinationId: string
): Promise<SavedRoute | null> {
  const route = await db.savedRoutes
    .where('origin_station_id')
    .equals(originId)
    .and((r) => r.destination_station_id === destinationId)
    .first();

  return route || null;
}

/**
 * Update last used timestamp and use count for a route
 */
export async function updateLastUsed(
  originId: string,
  destinationId: string
): Promise<SavedRoute[]> {
  const route = await getSavedRoute(originId, destinationId);

  if (route) {
    await db.savedRoutes.update(route.route_id, {
      last_used_at: new Date().toISOString(),
      use_count: (route.use_count || 0) + 1,
    });
  }

  return getSavedRoutes();
}
