import { getDatabase } from './database.service.js';
import { Train, TrainStatus } from '@metra/shared';
import { StopTime } from '@metra/shared';
import { getRealtimeTripUpdates } from './gtfs-realtime.service.js';
import {
  getCachedData,
  setCachedData,
  generateTrainCacheKey,
} from './cache.service.js';
import { normalizeHexColor, normalizeTextColor } from '../utils/color.utils.js';

/**
 * Train Service
 *
 * Queries trains by origin/destination from SQLite database
 * Applies realtime delays (stub implementation - will be enhanced with US2)
 */

/**
 * Get upcoming trains between origin and destination stations
 * @param originId - The origin station ID
 * @param destinationId - The destination station ID
 * @param limit - Maximum number of trains to return (optional)
 * @param time - Time to search from (optional, defaults to current time)
 * @param date - Date to search for (optional, defaults to today)
 * @returns Array of upcoming trains
 */
export const getUpcomingTrains = (
  originId: string,
  destinationId: string,
  limit?: number,
  time?: string,
  date?: string
): Train[] => {
  // Generate cache key - include date in cache key
  const cacheKey = generateTrainCacheKey(
    originId,
    destinationId,
    limit,
    time || date
  );

  // Check cache first
  const cachedData = getCachedData<Train[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const db = getDatabase();

  // Get current time if not provided - must be in Chicago timezone to match GTFS data
  const searchTime =
    time ||
    (() => {
      const now = new Date();
      // Format current time in Chicago timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const hour = parts.find((p) => p.type === 'hour')?.value || '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';
      const second = parts.find((p) => p.type === 'second')?.value || '00';
      return `${hour}:${minute}:${second}`;
    })();

  // Get date for calendar filtering (use provided date or today in Chicago timezone)
  const searchDate =
    date ||
    (() => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(now);
      const year = parts.find((p) => p.type === 'year')?.value || '';
      const month = parts.find((p) => p.type === 'month')?.value || '';
      const day = parts.find((p) => p.type === 'day')?.value || '';
      return `${year}-${month}-${day}`;
    })();

  // Get day of week for the search date (0 = Sunday, 1 = Monday, etc.)
  const searchDay = new Date(searchDate).getDay();
  const dayColumn = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ][searchDay];

  // Query to find trips that go from origin to destination
  // This query properly handles calendar_dates exceptions per GTFS spec:
  // - exception_type = 1: service added for this date (overrides calendar)
  // - exception_type = 2: service removed for this date (overrides calendar)
  // Note: Metra uses YYYY-MM-DD format for dates (not standard YYYYMMDD)
  const query = `
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
    LEFT JOIN calendar_dates cd ON t.service_id = cd.service_id AND cd.date = '${searchDate}'
    WHERE st1.stop_sequence < st2.stop_sequence
      AND st2.arrival_time >= ?
      AND (
        -- Service explicitly added for this specific date
        cd.exception_type = 1
        OR
        -- Regular service (no exception) running on this day
        (
          cd.service_id IS NULL
          AND c.${dayColumn} = 1
          AND c.start_date <= '${searchDate}'
          AND c.end_date >= '${searchDate}'
        )
      )
    ORDER BY st2.arrival_time
    ${limit ? `LIMIT ${limit}` : ''}
  `;

  const trips = db
    .prepare(query)
    .all(originId, destinationId, searchTime) as any[];

  // Get realtime data
  const tripUpdates = getRealtimeTripUpdates();

  // Helper to get Chicago timezone offset for a given date
  const getChicagoOffset = (dateStr: string): string => {
    // Create a specific moment in UTC (noon to avoid edge cases)
    const utcDate = new Date(`${dateStr}T12:00:00Z`);

    // Format in Chicago timezone to see what hour it is there
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      hour12: false,
    });

    const chicagoHourStr = formatter.format(utcDate);
    const chicagoHour = parseInt(chicagoHourStr);

    // Calculate offset: Chicago time - UTC time
    const utcHour = 12;
    let offsetHours = chicagoHour - utcHour;

    // Handle day boundary crossing
    if (offsetHours > 12) offsetHours -= 24;
    if (offsetHours < -12) offsetHours += 24;

    // Format as ±HH:MM
    const sign = offsetHours >= 0 ? '+' : '-';
    const absHours = Math.abs(offsetHours);

    return `${sign}${String(absHours).padStart(2, '0')}:00`;
  };

  // Transform trips to Train objects and deduplicate
  const trainMap = new Map<string, any>();

  for (const trip of trips) {
    // Get all stops for this trip
    const stops = getStopsForTrip(trip.trip_id, searchDate);

    // Find realtime trip update for this trip
    const realtimeTrip = tripUpdates.find(
      (update) => update.tripId === trip.trip_id
    );

    // Determine train status based on realtime data
    let status = TrainStatus.SCHEDULED;
    let delayMinutes = 0;

    if (realtimeTrip) {
      delayMinutes = realtimeTrip.delay || 0;
      if (delayMinutes > 0) {
        status = TrainStatus.DELAYED;
      } else if (delayMinutes < 0) {
        status = TrainStatus.EARLY;
      } else {
        status = TrainStatus.ON_TIME;
      }
    }

    // Construct proper datetime strings by combining date with time in Chicago timezone
    const constructDateTime = (timeStr: string): string => {
      if (!timeStr) return '';
      // GTFS times are in America/Chicago timezone, append proper offset instead of 'Z' (UTC)
      const offset = getChicagoOffset(searchDate);
      return `${searchDate}T${timeStr}${offset}`;
    };

    const train = {
      trip_id: trip.trip_id,
      line_id: trip.line_id,
      line_name: trip.line_name,
      line_color: normalizeHexColor(trip.route_color),
      line_text_color: normalizeTextColor(trip.route_text_color),
      origin_station_id: originId,
      destination_station_id: destinationId,
      departure_time: constructDateTime(trip.departure_time),
      arrival_time: constructDateTime(trip.arrival_time),
      status: status,
      delay_minutes: delayMinutes,
      stops: stops,
      service_id: trip.service_id,
      updated_at: new Date().toISOString(),
    } as Train;

    // Create a unique key based on departure time and line to deduplicate
    const key = `${trip.departure_time}-${trip.line_id}`;
    trainMap.set(key, train);
  }

  const uniqueTrains = Array.from(trainMap.values());

  // Cache the results
  setCachedData(cacheKey, uniqueTrains);

  return uniqueTrains;
};

/**
 * Get detailed train information including all stops
 * @param tripId - The trip ID to look up
 * @returns Detailed train information or null if not found
 */
export const getTrainDetail = (tripId: string): Train | null => {
  const db = getDatabase();

  // Query to get trip details
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

  const trip = db.prepare(query).get(tripId) as any | undefined;

  if (!trip) {
    return null;
  }

  // Get current date for constructing datetime strings
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Get all stops for this trip
  const stops = getStopsForTrip(tripId, dateString);

  // Find origin and destination from stops
  const originStopTime = stops[0];
  const destinationStopTime = stops[stops.length - 1];

  return {
    trip_id: trip.trip_id,
    line_id: trip.line_id,
    line_name: trip.line_name,
    line_color: normalizeHexColor(trip.route_color),
    line_text_color: normalizeTextColor(trip.route_text_color),
    origin_station_id: originStopTime?.station_id || '',
    destination_station_id: destinationStopTime?.station_id || '',
    departure_time: originStopTime?.departure_time || '',
    arrival_time: destinationStopTime?.arrival_time || '',
    status: TrainStatus.SCHEDULED, // Default status - will be enhanced with realtime data
    delay_minutes: 0, // Default delay - will be enhanced with realtime data
    stops: stops,
    service_id: trip.service_id,
    updated_at: new Date().toISOString(),
  } as Train;
};

/**
 * Get all stops for a specific trip
 * @param tripId - The trip ID to look up stops for
 * @param dateString - The date string (YYYY-MM-DD) for timezone calculations (optional, defaults to today)
 * @returns Array of StopTime objects for the trip
 */
const getStopsForTrip = (tripId: string, dateString?: string): StopTime[] => {
  const db = getDatabase();

  const stopTimes = db
    .prepare(
      `
    SELECT
      st.trip_id,
      st.stop_id as station_id,
      st.arrival_time,
      st.departure_time,
      st.stop_sequence,
      s.stop_name as station_name
    FROM stop_times st
    JOIN stops s ON st.stop_id = s.stop_id
    WHERE st.trip_id = ?
    ORDER BY st.stop_sequence
  `
    )
    .all(tripId) as any[];

  // Get current date for constructing datetime strings
  const today = new Date();
  const dateStr = dateString || today.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Helper to get Chicago timezone offset for a given date
  const getChicagoOffset = (dateStr: string): string => {
    // Create a specific moment in UTC (noon to avoid edge cases)
    const utcDate = new Date(`${dateStr}T12:00:00Z`);

    // Format in Chicago timezone to see what hour it is there
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      hour12: false,
    });

    const chicagoHourStr = formatter.format(utcDate);
    const chicagoHour = parseInt(chicagoHourStr);

    // Calculate offset: Chicago time - UTC time
    const utcHour = 12;
    let offsetHours = chicagoHour - utcHour;

    // Handle day boundary crossing
    if (offsetHours > 12) offsetHours -= 24;
    if (offsetHours < -12) offsetHours += 24;

    // Format as ±HH:MM
    const sign = offsetHours >= 0 ? '+' : '-';
    const absHours = Math.abs(offsetHours);

    return `${sign}${String(absHours).padStart(2, '0')}:00`;
  };

  // Construct proper datetime strings for stops in Chicago timezone
  const constructDateTime = (timeStr: string): string => {
    if (!timeStr) return '';
    // GTFS times are in America/Chicago timezone, append proper offset instead of 'Z' (UTC)
    const offset = getChicagoOffset(dateStr);
    return `${dateStr}T${timeStr}${offset}`;
  };

  // Transform stop times to StopTime objects with proper datetime strings
  return stopTimes.map((stopTime) => ({
    trip_id: stopTime.trip_id,
    station_id: stopTime.station_id,
    station_name: stopTime.station_name,
    arrival_time: constructDateTime(stopTime.arrival_time),
    departure_time: constructDateTime(stopTime.departure_time),
    stop_sequence: stopTime.stop_sequence,
    delay_minutes: 0, // Default delay - will be enhanced with realtime data
    headsign: '', // Will be populated from trip data
    platform: '', // Will be populated from station data
    pickup_type: 0,
    drop_off_type: 0,
  })) as StopTime[];
};
