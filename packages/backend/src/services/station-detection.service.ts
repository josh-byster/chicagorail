/**
 * Station Detection Service
 *
 * Determines which station a train is currently at or near based on:
 * - Vehicle position data (GPS coordinates)
 * - Current stop sequence
 * - Stop ID from realtime feed
 * - Geospatial calculations with bearing awareness
 *
 * Single Responsibility: Station location detection logic
 */

import type { StopTime } from '@metra/shared';
import type { RealtimeVehiclePosition } from './gtfs-realtime.service.js';
import {
  calculateHaversineDistance,
  calculateBearing,
  angleDifference,
} from '../utils/geospatial.utils.js';
import {
  findStationsByIds,
  type StationRow,
} from '../repositories/train.repository.js';

const BEARING_TOLERANCE_DEGREES = 45;

/**
 * Find the current station for a train based on realtime vehicle position
 *
 * Priority order:
 * 1. Explicit stop_id from GTFS-RT feed
 * 2. Current stop sequence from GTFS-RT feed
 * 3. Enhanced geospatial estimation using bearing
 *
 * @param position - Vehicle position from GTFS Realtime
 * @param stops - Array of stops for this trip
 * @returns Station ID or undefined if cannot determine
 */
export const findCurrentStation = (
  position: RealtimeVehiclePosition,
  stops: StopTime[]
): string | undefined => {
  if (!position.position) {
    return undefined;
  }

  // Priority 1: Use explicit stop_id if provided
  if (position.stopId) {
    return position.stopId;
  }

  // Priority 2: Use stop sequence if provided
  if (position.currentStopSequence) {
    const stop = stops.find(
      (s) => s.stop_sequence === position.currentStopSequence
    );
    if (stop) {
      return stop.station_id;
    }
  }

  // Priority 3: Geospatial estimation
  const lat = position.position.latitude;
  const lon = position.position.longitude;
  const bearing = position.position.bearing ?? null;

  if (lat !== undefined && lon !== undefined) {
    return findStationByLocation(lat, lon, bearing, stops);
  }

  return undefined;
};

/**
 * Find station using geospatial calculation with optional bearing enhancement
 *
 * @param lat - Current latitude
 * @param lon - Current longitude
 * @param bearing - Current bearing (null if not available)
 * @param stops - Array of stops for this trip
 * @returns Most likely station ID
 */
export const findStationByLocation = (
  lat: number,
  lon: number,
  bearing: number | null,
  stops: StopTime[]
): string | undefined => {
  if (!stops || stops.length === 0) {
    return undefined;
  }

  // Get station coordinates from database
  const stationIds = stops.map((stop) => stop.station_id);
  const stationRows = findStationsByIds(stationIds);

  if (stationRows.length === 0) {
    return undefined;
  }

  // If we have bearing information, use enhanced algorithm
  if (bearing !== null) {
    return findStationWithBearing(lat, lon, bearing, stationRows, stops);
  }

  // Otherwise, just find closest station
  return findClosestStation(lat, lon, stationRows);
};

/**
 * Find closest station by simple distance
 */
const findClosestStation = (
  lat: number,
  lon: number,
  stationRows: StationRow[]
): string | undefined => {
  let closestStation: string | undefined = undefined;
  let minDistance = Infinity;

  for (const station of stationRows) {
    const distance = calculateHaversineDistance(
      lat,
      lon,
      station.stop_lat,
      station.stop_lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestStation = station.stop_id;
    }
  }

  return closestStation;
};

/**
 * Enhanced station finding that considers train bearing
 * Filters stations to only those "ahead" of the train's direction
 */
const findStationWithBearing = (
  lat: number,
  lon: number,
  trainBearing: number,
  stationRows: StationRow[],
  stops: StopTime[]
): string | undefined => {
  // Calculate bearing to each station and filter by direction
  const candidateStations = stationRows.filter((station) => {
    const bearingToStation = calculateBearing(
      lat,
      lon,
      station.stop_lat,
      station.stop_lon
    );
    const diff = angleDifference(trainBearing, bearingToStation);
    return diff <= BEARING_TOLERANCE_DEGREES;
  });

  if (candidateStations.length === 0) {
    // No stations ahead, fall back to closest
    return findClosestStation(lat, lon, stationRows);
  }

  // Among candidates, prefer earlier stops in the sequence
  // This handles cases where multiple stations are in the same direction
  let bestCandidate: string | undefined = undefined;
  let minDistance = Infinity;
  let minStopSequence = Infinity;

  for (const station of candidateStations) {
    const distance = calculateHaversineDistance(
      lat,
      lon,
      station.stop_lat,
      station.stop_lon
    );

    const stop = stops.find((s) => s.station_id === station.stop_id);
    const stopSequence = stop?.stop_sequence ?? Infinity;

    // Prefer earlier stops (lower sequence number) if distances are similar
    if (
      stopSequence < minStopSequence ||
      (stopSequence === minStopSequence && distance < minDistance)
    ) {
      minDistance = distance;
      minStopSequence = stopSequence;
      bestCandidate = station.stop_id;
    }
  }

  return bestCandidate;
};
