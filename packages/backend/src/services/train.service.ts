import { getDatabase } from './database.service.js';
import { Train, TrainStatus, Position } from '@metra/shared';
import { StopTime } from '@metra/shared';
import {
  getRealtimeTripUpdates,
  getRealtimeVehiclePositions,
} from './gtfs-realtime.service.js';
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
    time,
    date
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
  // Use noon time to avoid timezone parsing issues (YYYY-MM-DD is parsed as UTC midnight)
  const searchDay = new Date(searchDate + 'T12:00:00').getDay();
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
      AND st1.departure_time >= ?
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
    ORDER BY st1.departure_time
    ${limit ? `LIMIT ${limit}` : ''}
  `;

  const trips = db
    .prepare(query)
    .all(originId, destinationId, searchTime) as any[];

  // Get realtime data
  const tripUpdates = getRealtimeTripUpdates();
  const vehiclePositions = getRealtimeVehiclePositions();

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

    // Find vehicle position for this trip
    const vehiclePosition = vehiclePositions.find(
      (position: any) => position.vehicle?.trip?.trip_id === trip.trip_id
    );

    // Add debugging to see what data we're working with
    if (vehiclePosition) {
      console.log(
        `Found vehicle position for trip ${trip.trip_id}:`,
        vehiclePosition
      );
    }

    // Determine train status based on realtime data
    let status = TrainStatus.SCHEDULED;
    let delayMinutes = 0;
    let currentStationId: string | undefined = undefined;
    let currentPosition: Position | undefined = undefined;

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

    // Set position data if available
    if (vehiclePosition?.vehicle?.position) {
      currentPosition = {
        latitude: vehiclePosition.vehicle.position.latitude,
        longitude: vehiclePosition.vehicle.position.longitude,
        bearing: vehiclePosition.vehicle.position.bearing,
        speed: vehiclePosition.vehicle.position.speed,
      };

      // Determine current station based on position data
      currentStationId = findCurrentStation(vehiclePosition, stops);
    }

    // Construct proper datetime strings by combining date with time in Chicago timezone
    const constructDateTime = (timeStr: string): string => {
      if (!timeStr) return '';

      // Handle GTFS times that go past midnight (e.g., "25:30:00" for 1:30 AM next day)
      const [hours, minutes, seconds] = timeStr.split(':').map(Number);
      let adjustedDate = searchDate;
      let adjustedHours = hours;

      if (hours >= 24) {
        // Calculate how many days to add
        const daysToAdd = Math.floor(hours / 24);
        adjustedHours = hours % 24;

        // Add days to the date
        const date = new Date(searchDate);
        date.setDate(date.getDate() + daysToAdd);
        adjustedDate = date.toISOString().split('T')[0];
      }

      const normalizedTime = `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      const offset = getChicagoOffset(adjustedDate);
      return `${adjustedDate}T${normalizedTime}${offset}`;
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
      current_station_id: currentStationId,
      current_position: currentPosition,
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

  // Get realtime data for this specific train
  const tripUpdates = getRealtimeTripUpdates();
  const vehiclePositions = getRealtimeVehiclePositions();

  // Find realtime trip update for this trip
  const realtimeTrip = tripUpdates.find(
    (update: any) => update.tripId === tripId
  );

  // Find vehicle position for this trip
  const vehiclePosition = vehiclePositions.find(
    (position: any) => position.vehicle?.trip?.trip_id === tripId
  );

  // Add debugging to see what data we're working with
  if (vehiclePosition) {
    console.log(`Found vehicle position for trip ${tripId}:`, vehiclePosition);
  } else {
    console.log(`No vehicle position found for trip ${tripId}`);
    console.log(`Available vehicle positions:`, vehiclePositions);
  }

  // Determine train status based on realtime data
  let status = TrainStatus.SCHEDULED;
  let delayMinutes = 0;
  let currentStationId: string | undefined = undefined;
  let currentPosition: Position | undefined = undefined;

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

  // Set position data if available
  if (vehiclePosition?.vehicle?.position) {
    currentPosition = {
      latitude: vehiclePosition.vehicle.position.latitude,
      longitude: vehiclePosition.vehicle.position.longitude,
      bearing: vehiclePosition.vehicle.position.bearing,
      speed: vehiclePosition.vehicle.position.speed,
    };

    // Determine current station based on position data
    currentStationId = findCurrentStation(vehiclePosition, stops);
  }

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
    status: status,
    delay_minutes: delayMinutes,
    current_station_id: currentStationId,
    current_position: currentPosition,
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

    // Handle GTFS times that go past midnight (e.g., "25:30:00" for 1:30 AM next day)
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    let adjustedDate = dateStr;
    let adjustedHours = hours;

    if (hours >= 24) {
      // Calculate how many days to add
      const daysToAdd = Math.floor(hours / 24);
      adjustedHours = hours % 24;

      // Add days to the date
      const date = new Date(dateStr);
      date.setDate(date.getDate() + daysToAdd);
      adjustedDate = date.toISOString().split('T')[0];
    }

    const normalizedTime = `${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const offset = getChicagoOffset(adjustedDate);
    return `${adjustedDate}T${normalizedTime}${offset}`;
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

/**
 * Find the closest station to a given latitude/longitude position
 * @param lat - Latitude of the train position
 * @param lon - Longitude of the train position
 * @param stops - Array of stops to search through
 * @returns The station_id of the closest station, or undefined if no stops available
 */
const findClosestStation = (
  lat: number,
  lon: number,
  stops: StopTime[]
): string | undefined => {
  if (!stops || stops.length === 0) {
    console.log('No stops provided to findClosestStation');
    return undefined;
  }

  // Get all stations with their coordinates from the database
  const db = getDatabase();
  const stationQuery = `
    SELECT stop_id, stop_lat, stop_lon
    FROM stops
    WHERE stop_id IN (${stops.map(() => '?').join(',')})
  `;

  const stationIds = stops.map((stop) => stop.station_id);
  console.log('Looking up stations:', stationIds);
  const stationRows = db.prepare(stationQuery).all(...stationIds) as any[];
  console.log('Found station rows:', stationRows);

  if (stationRows.length === 0) {
    console.log('No station rows found in database');
    return undefined;
  }

  let closestStation: string | undefined = undefined;
  let minDistance = Infinity;

  // Calculate distance to each station using Haversine formula
  for (const station of stationRows) {
    const distance = calculateHaversineDistance(
      lat,
      lon,
      station.stop_lat,
      station.stop_lon
    );
    console.log(
      `Distance from (${lat}, ${lon}) to station ${station.stop_id} (${station.stop_lat}, ${station.stop_lon}): ${distance} miles`
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestStation = station.stop_id;
    }
  }

  console.log(
    `Closest station overall: ${closestStation} at ${minDistance} miles`
  );
  return closestStation;
};

/**
 * Find the most likely current station based on position, bearing, and stop sequence
 * @param position - Vehicle position data from GTFS realtime API
 * @param stops - Array of stops for this trip
 * @returns The most likely current station_id, or undefined if unable to determine
 */
const findCurrentStation = (
  position: any,
  stops: StopTime[]
): string | undefined => {
  const lat = position.vehicle.position.latitude;
  const lon = position.vehicle.position.longitude;
  const bearing = position.vehicle.position.bearing;
  const currentStopSequence = position.vehicle.current_stop_sequence;
  const stopId = position.vehicle.stop_id;

  // If exact stop_id is provided, use it
  if (stopId) {
    return stopId;
  }

  // If stop sequence is provided, find the corresponding stop
  if (currentStopSequence) {
    const stop = stops.find((s) => s.stop_sequence === currentStopSequence);
    if (stop) {
      return stop.station_id;
    }
  }

  // Fall back to enhanced geospatial estimation that considers bearing
  return findCurrentStationEnhanced(lat, lon, bearing, stops);
};

/**
 * Enhanced geospatial estimation that considers train bearing and stop sequence
 * @param lat - Current latitude of train
 * @param lon - Current longitude of train
 * @param bearing - Current bearing of train (0-359 degrees)
 * @param stops - Array of stops for this trip
 * @returns The most likely current station_id based on position and direction
 */
const findCurrentStationEnhanced = (
  lat: number,
  lon: number,
  bearing: number | null,
  stops: StopTime[]
): string | undefined => {
  if (!stops || stops.length === 0) {
    console.log('No stops provided to findCurrentStationEnhanced');
    return undefined;
  }

  // Get all stations with their coordinates from the database
  const db = getDatabase();
  const stationQuery = `
    SELECT stop_id, stop_lat, stop_lon
    FROM stops
    WHERE stop_id IN (${stops.map(() => '?').join(',')})
  `;

  const stationIds = stops.map((stop) => stop.station_id);
  console.log('Looking up stations for enhanced estimation:', stationIds);
  const stationRows = db.prepare(stationQuery).all(...stationIds) as any[];
  console.log('Found station rows for enhanced estimation:', stationRows);

  if (stationRows.length === 0) {
    console.log('No station rows found in database for enhanced estimation');
    return undefined;
  }

  // If we have bearing information, use it to weight stations in the direction of travel
  if (bearing !== null && bearing !== undefined) {
    console.log(`Using bearing ${bearing}° to enhance station estimation`);

    // Find stations that are in the general direction of travel
    const stationsInDirection = stationRows.filter((station) => {
      // For each station, calculate if it's roughly in the direction of travel
      for (let i = 0; i < stops.length - 1; i++) {
        const currentStop = stops[i];
        const nextStop = stops[i + 1];

        if (currentStop.station_id === station.stop_id) {
          const nextStation = stationRows.find(
            (s) => s.stop_id === nextStop.station_id
          );
          if (nextStation) {
            // Calculate bearing from current station to next station
            const stationBearing = calculateBearing(
              station.stop_lat,
              station.stop_lon,
              nextStation.stop_lat,
              nextStation.stop_lon
            );

            // Check if the train's bearing is roughly aligned with the direction to the next station
            // Allow for some variance (±45 degrees) due to GPS inaccuracies
            const bearingDiff = Math.abs(stationBearing - bearing);
            const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff);

            return normalizedDiff <= 45;
          }
        }
      }
      return false;
    });

    // If we found stations in the direction of travel, find the closest among them
    if (stationsInDirection.length > 0) {
      console.log(
        `Found ${stationsInDirection.length} stations in direction of travel`
      );

      let closestStation: string | undefined = undefined;
      let minDistance = Infinity;

      for (const station of stationsInDirection) {
        const distance = calculateHaversineDistance(
          lat,
          lon,
          station.stop_lat,
          station.stop_lon
        );
        console.log(
          `Distance to station ${station.stop_id} in direction: ${distance} miles`
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestStation = station.stop_id;
        }
      }

      if (closestStation) {
        console.log(
          `Enhanced estimation found station in direction: ${closestStation} at ${minDistance} miles`
        );
        return closestStation;
      }
    }
  }

  // Fall back to simple closest station calculation
  return findClosestStation(lat, lon, stops);
};

/**
 * Calculate bearing between two points (0-359 degrees)
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Bearing in degrees
 */
const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
};

/**
 * Calculate Haversine distance between two points in miles
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in miles
 */
const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
