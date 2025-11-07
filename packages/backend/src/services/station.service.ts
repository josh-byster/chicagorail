import { getDatabase } from './database.service.js';
import { Station } from '@metra/shared';
import {
  transformStationRow,
  transformStationRows,
  type StationRow,
} from '../mappers/station.mapper.js';

/**
 * Station Service
 *
 * Queries stations from SQLite database
 * Can filter stations by line
 */

/**
 * Get all stations
 * @returns Array of all stations
 */
export const getAllStations = (): Station[] => {
  const db = getDatabase();

  const stations = db
    .prepare(
      `
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
  `
    )
    .all() as StationRow[];

  return transformStationRows(stations);
};

/**
 * Get stations by line ID
 * @param lineId - The line ID to filter stations by
 * @returns Array of stations that serve the specified line
 */
export const getStationsByLine = (lineId: string): Station[] => {
  const db = getDatabase();

  const stations = db
    .prepare(
      `
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
  `
    )
    .all(`%${lineId}%`) as StationRow[];

  return transformStationRows(stations);
};

/**
 * Get station by ID
 * @param stationId - The station ID to look up
 * @returns Station object or null if not found
 */
export const getStationById = (stationId: string): Station | null => {
  const db = getDatabase();

  const station = db
    .prepare(
      `
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
  `
    )
    .get(stationId) as StationRow | undefined;

  if (!station) {
    return null;
  }

  return transformStationRow(station);
};

/**
 * Get reachable stations from an origin station
 * @param originId - The origin station ID
 * @returns Array of stations that can be reached from the origin
 */
export const getReachableStations = (originId: string): Station[] => {
  const db = getDatabase();

  const stations = db
    .prepare(
      `
    SELECT DISTINCT
      s.stop_id as station_id,
      s.stop_name as station_name,
      s.stop_lat as latitude,
      s.stop_lon as longitude,
      s.lines_served,
      s.zone_id as zone,
      s.wheelchair_boarding as wheelchair_accessible
    FROM stops s
    WHERE s.stop_id IN (
      SELECT DISTINCT st2.stop_id
      FROM stop_times st1
      JOIN stop_times st2 ON st1.trip_id = st2.trip_id
      WHERE st1.stop_id = ?
        AND st2.stop_id != ?
        AND st1.stop_sequence < st2.stop_sequence
    )
    ORDER BY s.stop_name
  `
    )
    .all(originId, originId) as StationRow[];

  return transformStationRows(stations);
};
