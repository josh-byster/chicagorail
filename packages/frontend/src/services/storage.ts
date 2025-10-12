import Dexie, { Table } from 'dexie';
import type { Station, Line, Train } from '@metra/shared';

export interface CachedTrain extends Train {
  cached_at: number; // Timestamp
}

export interface SavedRoute {
  route_id: string;
  origin_station_id: string;
  destination_station_id: string;
  label: string;
  created_at: string;
  last_used_at: string;
  use_count: number;
}

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
      trains: 'trip_id, line_id, origin_station_id, destination_station_id, cached_at',
      savedRoutes: 'route_id, origin_station_id, destination_station_id, last_used_at',
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

export async function getCachedStation(stationId: string): Promise<Station | undefined> {
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
  const cachedTrains: CachedTrain[] = trains.map(train => ({
    ...train,
    cached_at: Date.now(),
  }));

  await db.trains.bulkPut(cachedTrains);
}

export async function getCachedTrains(
  originId: string,
  destinationId: string,
  maxAge = 30000 // 30 seconds
): Promise<Train[] | null> {
  const now = Date.now();
  const trains = await db.trains
    .where('origin_station_id')
    .equals(originId)
    .and(train =>
      train.destination_station_id === destinationId &&
      now - train.cached_at < maxAge
    )
    .toArray();

  if (trains.length === 0) return null;

  // Remove cached_at before returning
  return trains.map(({ cached_at, ...train }) => train);
}

// Clear old cached trains
export async function clearStaleTrains(maxAge = 60000): Promise<void> {
  const cutoff = Date.now() - maxAge;
  await db.trains.where('cached_at').below(cutoff).delete();
}

// Saved Routes helpers
export async function saveRoute(route: Omit<SavedRoute, 'route_id' | 'created_at'>): Promise<string> {
  const routeId = crypto.randomUUID();
  const newRoute: SavedRoute = {
    ...route,
    route_id: routeId,
    created_at: new Date().toISOString(),
  };

  await db.savedRoutes.put(newRoute);
  return routeId;
}

export async function getSavedRoutes(): Promise<SavedRoute[]> {
  return db.savedRoutes.orderBy('last_used_at').reverse().toArray();
}

export async function updateRouteUsage(routeId: string): Promise<void> {
  const route = await db.savedRoutes.get(routeId);
  if (!route) return;

  await db.savedRoutes.update(routeId, {
    last_used_at: new Date().toISOString(),
    use_count: route.use_count + 1,
  });
}

export async function deleteRoute(routeId: string): Promise<void> {
  await db.savedRoutes.delete(routeId);
}
