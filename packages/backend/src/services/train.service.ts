import { getDatabase } from './database.service';
import { Train, TrainStatus, Position } from '@metra/shared';
import { StopTime } from '@metra/shared';
import { getRealtimeTripUpdates, getRealtimeVehiclePositions } from './gtfs-realtime.service';
import { getCachedData, setCachedData, generateTrainCacheKey } from './cache.service';

/**
 * Train Service
 *
 * Queries trains by origin/destination from SQLite database
 * Applies realtime delays (stub implementation - will be enhanced with US2)
 */

interface TripRow {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign: string;
  direction_id: number;
  line_id: string;
  line_name: string;
  departure_time: string;
  arrival_time: string;
}

interface StopTimeRow {
  trip_id: string;
  stop_id: string;
  stop_sequence: number;
  arrival_time: string;
  departure_time: string;
  station_id: string;
  station_name: string;
}

interface CalendarRow {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string;
  end_date: string;
}

/**
 * Get upcoming trains between origin and destination stations
 * @param originId - The origin station ID
 * @param destinationId - The destination station ID
 * @param limit - Maximum number of trains to return (optional)
 * @param time - Time to search from (optional, defaults to current time)
 * @returns Array of upcoming trains
 */
export const getUpcomingTrains = (
  originId: string,
  destinationId: string,
  limit?: number,
  time?: string
): Train[] => {
  // Generate cache key
  const cacheKey = generateTrainCacheKey(originId, destinationId, limit, time);
  
  // Check cache first
  const cachedData = getCachedData<Train[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  const db = getDatabase();
  
  // Get current time if not provided
  const searchTime = time || new Date().toISOString().slice(11, 19); // HH:MM:SS format
  
  // Query to find trips that go from origin to destination
  const query = `
    SELECT 
      t.trip_id,
      t.route_id as line_id,
      r.route_long_name as line_name,
      st1.stop_id as origin_station_id,
      st2.stop_id as destination_station_id,
      st1.departure_time,
      st2.arrival_time,
      t.service_id
    FROM trips t
    JOIN routes r ON t.route_id = r.route_id
    JOIN stop_times st1 ON t.trip_id = st1.trip_id
    JOIN stop_times st2 ON t.trip_id = st2.trip_id
    WHERE st1.stop_id = ?
      AND st2.stop_id = ?
      AND st1.stop_sequence < st2.stop_sequence
      AND st2.arrival_time >= ?
    ORDER BY st2.arrival_time
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  
  const trips = db.prepare(query).all(originId, destinationId, searchTime) as any[];
  
  // Get realtime data
  const tripUpdates = getRealtimeTripUpdates();
  
  // Transform trips to Train objects
  const trains = trips.map((trip) => {
    // Get all stops for this trip
    const stops = getStopsForTrip(trip.trip_id);
    
    // Find the origin and destination stop times
    const originStopTime = stops.find(stop => stop.station_id === originId);
    const destinationStopTime = stops.find(stop => stop.station_id === destinationId);
    
    // Find realtime trip update for this trip
    const realtimeTrip = tripUpdates.find(update => update.tripId === trip.trip_id);
    
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
    
    return {
      trip_id: trip.trip_id,
      line_id: trip.line_id,
      line_name: trip.line_name,
      origin_station_id: originId,
      destination_station_id: destinationId,
      departure_time: originStopTime?.departure_time || trip.departure_time,
      arrival_time: destinationStopTime?.arrival_time || trip.arrival_time,
      status: status,
      delay_minutes: delayMinutes,
      stops: stops,
      service_id: trip.service_id,
      updated_at: new Date().toISOString(),
    } as Train;
  });
  
  // Cache the results
  setCachedData(cacheKey, trains);
  
  return trains;
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
  
  // Get all stops for this trip
  const stops = getStopsForTrip(tripId);
  
  // Find origin and destination from stops
  const originStopTime = stops[0];
  const destinationStopTime = stops[stops.length - 1];
  
  return {
    trip_id: trip.trip_id,
    line_id: trip.line_id,
    line_name: trip.line_name,
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
 * @returns Array of StopTime objects for the trip
 */
const getStopsForTrip = (tripId: string): StopTime[] => {
  const db = getDatabase();
  
  const stopTimes = db.prepare(`
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
  `).all(tripId) as any[];
  
  // Transform stop times to StopTime objects
  return stopTimes.map((stopTime) => ({
    trip_id: stopTime.trip_id,
    station_id: stopTime.station_id,
    arrival_time: stopTime.arrival_time,
    departure_time: stopTime.departure_time,
    stop_sequence: stopTime.stop_sequence,
    delay_minutes: 0, // Default delay - will be enhanced with realtime data
    headsign: '', // Will be populated from trip data
    platform: '', // Will be populated from station data
    pickup_type: 0,
    drop_off_type: 0,
  })) as StopTime[];
};
