/**
 * Train Service
 *
 * High-level service for train queries and operations.
 * Orchestrates repositories and integration services.
 *
 * Single Responsibility: Train business logic orchestration
 */

import type { Train, StopTime } from '@metra/shared';
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
import {
  constructDateTime,
  getCurrentChicagoTime,
  getCurrentChicagoDate,
  getDayColumn,
} from '../utils/datetime.utils.js';
import {
  findTrips,
  findTripById,
  findStopTimesForTrip,
  type FindTripsParams,
} from '../repositories/train.repository.js';
import { integrateRealtimeData } from './realtime-integration.service.js';

/**
 * Get upcoming trains between origin and destination stations
 */
export const getUpcomingTrains = (
  originId: string,
  destinationId: string,
  limit?: number,
  time?: string,
  date?: string
): Train[] => {
  // Check cache first
  const cacheKey = generateTrainCacheKey(
    originId,
    destinationId,
    limit,
    time,
    date
  );
  const cachedData = getCachedData<Train[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Get search parameters
  const searchTime = time || getCurrentChicagoTime();
  const searchDate = date || getCurrentChicagoDate();
  const dayColumn = getDayColumn(searchDate);

  // Query database
  const params: FindTripsParams = {
    originId,
    destinationId,
    searchDate,
    searchTime,
    dayColumn,
    limit,
  };
  const trips = findTrips(params);

  // Get realtime data
  const tripUpdates = getRealtimeTripUpdates();
  const vehiclePositions = getRealtimeVehiclePositions();

  // Transform and integrate realtime data
  const trainMap = new Map<string, Train>();

  for (const trip of trips) {
    const stops = getStopsForTrip(trip.trip_id, searchDate);

    const realtimeData = integrateRealtimeData(
      trip.trip_id,
      tripUpdates,
      vehiclePositions,
      stops
    );

    const train: Train = {
      trip_id: trip.trip_id,
      line_id: trip.line_id,
      line_name: trip.line_name,
      line_color: normalizeHexColor(trip.route_color),
      line_text_color: normalizeTextColor(trip.route_text_color),
      origin_station_id: originId,
      destination_station_id: destinationId,
      departure_time: constructDateTime(trip.departure_time, searchDate),
      arrival_time: constructDateTime(trip.arrival_time, searchDate),
      status: realtimeData.status,
      delay_minutes: realtimeData.delayMinutes,
      current_station_id: realtimeData.currentStationId,
      current_position: realtimeData.currentPosition,
      stops,
      service_id: trip.service_id,
      updated_at: new Date().toISOString(),
    };

    // Deduplicate by departure time and line
    const key = `${trip.departure_time}-${trip.line_id}`;
    trainMap.set(key, train);
  }

  const uniqueTrains = Array.from(trainMap.values());

  // Cache and return
  setCachedData(cacheKey, uniqueTrains);
  return uniqueTrains;
};

/**
 * Get detailed train information by trip ID
 */
export const getTrainDetail = (tripId: string): Train | null => {
  const trip = findTripById(tripId);
  if (!trip) {
    return null;
  }

  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  const stops = getStopsForTrip(tripId, dateString);

  const tripUpdates = getRealtimeTripUpdates();
  const vehiclePositions = getRealtimeVehiclePositions();

  const realtimeData = integrateRealtimeData(
    tripId,
    tripUpdates,
    vehiclePositions,
    stops
  );

  return {
    trip_id: trip.trip_id,
    line_id: trip.line_id,
    line_name: trip.line_name,
    line_color: normalizeHexColor(trip.route_color),
    line_text_color: normalizeTextColor(trip.route_text_color),
    origin_station_id: stops[0]?.station_id || '',
    destination_station_id: stops[stops.length - 1]?.station_id || '',
    departure_time: stops[0]?.departure_time || '',
    arrival_time: stops[stops.length - 1]?.arrival_time || '',
    status: realtimeData.status,
    delay_minutes: realtimeData.delayMinutes,
    current_station_id: realtimeData.currentStationId,
    current_position: realtimeData.currentPosition,
    stops,
    service_id: trip.service_id,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Get stops for a trip with proper datetime formatting
 */
export const getStopsForTrip = (
  tripId: string,
  dateString?: string
): StopTime[] => {
  const stopTimes = findStopTimesForTrip(tripId);
  const today = new Date();
  const dateStr = dateString || today.toISOString().split('T')[0];

  return stopTimes.map((stopTime) => ({
    trip_id: stopTime.trip_id,
    station_id: stopTime.station_id,
    station_name: stopTime.station_name,
    arrival_time: constructDateTime(stopTime.arrival_time, dateStr),
    departure_time: constructDateTime(stopTime.departure_time, dateStr),
    stop_sequence: stopTime.stop_sequence,
    delay_minutes: 0,
    headsign: '',
    platform: '',
    pickup_type: 0,
    drop_off_type: 0,
  }));
};
