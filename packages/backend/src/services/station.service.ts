import { getDatabase } from './database.service';
import { Station } from '@metra/shared';

/**
 * Station Service
 *
 * Queries stations from SQLite database
 * Can filter stations by line
 */

interface StopRow {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  lines_served: string;
  zone: string | null;
  wheelchair_accessible: number;
}

/**
 * Get all stations
 * @returns Array of all stations
 */
export const getAllStations = (): Station[] => {
  const db = getDatabase();
  
  const stations = db.prepare(`
    SELECT 
      stop_id as station_id,
      stop_name as station_name,
      stop_lat as latitude,
      stop_lon as longitude,
      lines_served,
      zone_id as zone,
      wheelchair_boarding as wheelchair_accessible
    FROM stops
    ORDER BY stop_name
  `).all() as StopRow[];

  // Transform database rows to Station objects
  return stations.map((row) => ({
    station_id: row.station_id,
    station_name: row.station_name,
    latitude: row.latitude,
    longitude: row.longitude,
    lines_served: JSON.parse(row.lines_served || '[]'),
    zone: row.zone || undefined,
    wheelchair_accessible: row.wheelchair_accessible === 1,
  }));
};

/**
 * Get stations by line ID
 * @param lineId - The line ID to filter stations by
 * @returns Array of stations that serve the specified line
 */
export const getStationsByLine = (lineId: string): Station[] => {
  const db = getDatabase();
  
  // Query stations that serve the specified line
  const stations = db.prepare(`
    SELECT 
      stop_id as station_id,
      stop_name as station_name,
      stop_lat as latitude,
      stop_lon as longitude,
      lines_served,
      zone_id as zone,
      wheelchair_boarding as wheelchair_accessible
    FROM stops
    WHERE lines_served LIKE ?
    ORDER BY stop_name
  `).all(`%${lineId}%`) as StopRow[];

  // Transform database rows to Station objects
  return stations.map((row) => ({
    station_id: row.station_id,
    station_name: row.station_name,
    latitude: row.latitude,
    longitude: row.longitude,
    lines_served: JSON.parse(row.lines_served || '[]'),
    zone: row.zone || undefined,
    wheelchair_accessible: row.wheelchair_accessible === 1,
  }));
};

/**
 * Get station by ID
 * @param stationId - The station ID to look up
 * @returns Station object or null if not found
 */
export const getStationById = (stationId: string): Station | null => {
  const db = getDatabase();
  
  const station = db.prepare(`
    SELECT 
      stop_id as station_id,
      stop_name as station_name,
      stop_lat as latitude,
      stop_lon as longitude,
      lines_served,
      zone_id as zone,
      wheelchair_boarding as wheelchair_accessible
    FROM stops
    WHERE stop_id = ?
  `).get(stationId) as StopRow | undefined;

  if (!station) {
    return null;
  }

  // Transform database row to Station object
  return {
    station_id: station.station_id,
    station_name: station.station_name,
    latitude: station.latitude,
    longitude: station.longitude,
    lines_served: JSON.parse(station.lines_served || '[]'),
    zone: station.zone || undefined,
    wheelchair_accessible: station.wheelchair_accessible === 1,
  };
};
