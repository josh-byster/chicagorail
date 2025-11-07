/**
 * Train Repository
 *
 * Data access layer for train-related database queries.
 * Follows Repository pattern for separation of concerns.
 */

import { getDatabase } from '../services/database.service.js';

/**
 * Database row types
 */
export interface TripRow {
  trip_id: string;
  line_id: string;
  line_name: string;
  route_color: string;
  route_text_color: string;
  origin_station_id: string;
  destination_station_id: string;
  departure_time: string;
  arrival_time: string;
  service_id: string;
  direction_id: number;
}

export interface StopTimeRow {
  trip_id: string;
  station_id: string;
  station_name: string;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
}

export interface StationRow {
  stop_id: string;
  stop_lat: number;
  stop_lon: number;
}

/**
 * Query parameters for finding trips
 */
export interface FindTripsParams {
  originId: string;
  destinationId: string;
  searchDate: string;
  searchTime: string;
  dayColumn: string;
  limit?: number;
}

/**
 * Find trips between origin and destination on a specific date
 */
export const findTrips = (params: FindTripsParams): TripRow[] => {
  const db = getDatabase();
  const { originId, destinationId, searchDate, searchTime, dayColumn, limit } =
    params;

  // Build query with proper parameterization
  let query = `
    SELECT
      t.trip_id,
      t.route_id as line_id,
      r.route_long_name as line_name,
      r.route_color,
      r.route_text_color,
      st1.stop_id as origin_station_id,
      st2.stop_id as destination_station_id,
      st1.departure_time,
      st2.arrival_time,
      t.service_id,
      t.direction_id
    FROM trips t
    JOIN routes r ON t.route_id = r.route_id
    JOIN stop_times st1 ON t.trip_id = st1.trip_id AND st1.stop_id = ?
    JOIN stop_times st2 ON t.trip_id = st2.trip_id AND st2.stop_id = ?
    LEFT JOIN calendar c ON t.service_id = c.service_id
    LEFT JOIN calendar_dates cd ON t.service_id = cd.service_id AND cd.date = ?
    WHERE st1.stop_sequence < st2.stop_sequence
      AND st1.departure_time >= ?
      AND (
        cd.exception_type = 1
        OR
        (
          cd.service_id IS NULL
          AND c.${dayColumn} = 1
          AND c.start_date <= ?
          AND c.end_date >= ?
        )
      )
    ORDER BY st1.departure_time
  `;

  const queryParams: (string | number)[] = [
    originId,
    destinationId,
    searchDate,
    searchTime,
    searchDate,
    searchDate,
  ];

  if (limit && typeof limit === 'number') {
    query += ` LIMIT ?`;
    queryParams.push(limit);
  }

  return db.prepare(query).all(...queryParams) as TripRow[];
};

/**
 * Find a single trip by ID
 */
export const findTripById = (tripId: string): TripRow | undefined => {
  const db = getDatabase();

  const query = `
    SELECT
      t.trip_id,
      t.route_id as line_id,
      r.route_long_name as line_name,
      r.route_color,
      r.route_text_color,
      t.trip_headsign,
      t.service_id
    FROM trips t
    JOIN routes r ON t.route_id = r.route_id
    WHERE t.trip_id = ?
  `;

  return db.prepare(query).get(tripId) as TripRow | undefined;
};

/**
 * Get all stop times for a trip
 */
export const findStopTimesForTrip = (tripId: string): StopTimeRow[] => {
  const db = getDatabase();

  const query = `
    SELECT
      st.trip_id,
      st.stop_id as station_id,
      s.stop_name as station_name,
      st.arrival_time,
      st.departure_time,
      st.stop_sequence
    FROM stop_times st
    JOIN stops s ON st.stop_id = s.stop_id
    WHERE st.trip_id = ?
    ORDER BY st.stop_sequence
  `;

  return db.prepare(query).all(tripId) as StopTimeRow[];
};

/**
 * Find stations by IDs with coordinates
 */
export const findStationsByIds = (stationIds: string[]): StationRow[] => {
  if (!stationIds || stationIds.length === 0) {
    return [];
  }

  const db = getDatabase();
  const placeholders = stationIds.map(() => '?').join(',');

  const query = `
    SELECT stop_id, stop_lat, stop_lon
    FROM stops
    WHERE stop_id IN (${placeholders})
  `;

  return db.prepare(query).all(...stationIds) as StationRow[];
};
