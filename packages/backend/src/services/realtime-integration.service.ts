/**
 * Realtime Integration Service
 *
 * Merges GTFS static schedule data with GTFS Realtime data.
 * Determines train status, delays, and current positions.
 *
 * Single Responsibility: Realtime data integration
 */

import type { TrainStatus, Position, StopTime } from '@metra/shared';
import { TrainStatus as Status } from '@metra/shared';
import type {
  RealtimeTripUpdate,
  RealtimeVehiclePosition,
} from './gtfs-realtime.service.js';
import { findCurrentStation } from './station-detection.service.js';

/**
 * Integration result containing status and position data
 */
export interface RealtimeIntegrationResult {
  status: TrainStatus;
  delayMinutes: number;
  currentStationId: string | undefined;
  currentPosition: Position | undefined;
}

/**
 * Integrate realtime data for a specific trip
 *
 * @param tripId - The trip ID to look up
 * @param tripUpdates - Array of realtime trip updates
 * @param vehiclePositions - Array of realtime vehicle positions
 * @param stops - Array of stops for this trip
 * @returns Integration result with status and position
 */
export const integrateRealtimeData = (
  tripId: string,
  tripUpdates: RealtimeTripUpdate[],
  vehiclePositions: RealtimeVehiclePosition[],
  stops: StopTime[]
): RealtimeIntegrationResult => {
  // Find realtime trip update
  const realtimeTrip = tripUpdates.find((update) => update.tripId === tripId);

  // Find vehicle position
  const vehiclePosition = vehiclePositions.find(
    (position) => position.trip?.tripId === tripId
  );

  // Determine status and delay
  const { status, delayMinutes } = determineTrainStatus(realtimeTrip);

  // Determine current position
  const { currentStationId, currentPosition } = determineCurrentPosition(
    vehiclePosition,
    stops
  );

  return {
    status,
    delayMinutes,
    currentStationId,
    currentPosition,
  };
};

/**
 * Determine train status based on realtime trip update
 */
const determineTrainStatus = (
  realtimeTrip: RealtimeTripUpdate | undefined
): { status: TrainStatus; delayMinutes: number } => {
  if (!realtimeTrip) {
    return {
      status: Status.SCHEDULED,
      delayMinutes: 0,
    };
  }

  const delayMinutes = realtimeTrip.delay || 0;

  let status: TrainStatus;
  if (delayMinutes > 0) {
    status = Status.DELAYED;
  } else if (delayMinutes < 0) {
    status = Status.EARLY;
  } else {
    status = Status.ON_TIME;
  }

  return { status, delayMinutes };
};

/**
 * Determine current position from vehicle position data
 */
const determineCurrentPosition = (
  vehiclePosition: RealtimeVehiclePosition | undefined,
  stops: StopTime[]
): {
  currentStationId: string | undefined;
  currentPosition: Position | undefined;
} => {
  if (!vehiclePosition?.position) {
    return {
      currentStationId: undefined,
      currentPosition: undefined,
    };
  }

  const currentPosition: Position = {
    latitude: vehiclePosition.position.latitude ?? 0,
    longitude: vehiclePosition.position.longitude ?? 0,
    bearing: vehiclePosition.position.bearing ?? undefined,
    speed: vehiclePosition.position.speed ?? undefined,
  };

  const currentStationId = findCurrentStation(vehiclePosition, stops);

  return {
    currentStationId,
    currentPosition,
  };
};
