/**
 * Merges realtime predictions into scheduled API responses.
 *
 * Pure functions over a RealtimeSnapshot so the merge logic is testable
 * without a live feed.
 */

import type {
  Departure,
  DirectTrip,
  GetTripDetailsResponse,
  RealtimePrediction,
  RealtimeStatus,
  TripStop,
  VehiclePosition,
} from '@chicagorail/shared';
import type { RealtimeSnapshot, StopPrediction, TripRealtime } from './realtimeService';

/** Under a minute either way still counts as on time */
const ON_TIME_THRESHOLD_SECONDS = 60;

/** Departures and trip endpoints don't carry the stop's position in the trip */
const UNKNOWN_SEQUENCE = -1;

function statusFor(delaySeconds: number): RealtimeStatus {
  if (Math.abs(delaySeconds) < ON_TIME_THRESHOLD_SECONDS) return 'on_time';
  return delaySeconds > 0 ? 'late' : 'early';
}

/**
 * The feed's prediction for one stop.
 *
 * Producers may only enumerate some stops, so per the GTFS-rt spec a stop with
 * no update of its own inherits the delay of the last preceding stop that had
 * one, and failing that the trip-level delay.
 */
function predictionForStop(
  trip: TripRealtime,
  stopId: string,
  stopSequence: number
): { delay: number; absoluteTime?: number } | null {
  const exact: StopPrediction | undefined =
    trip.byStopId.get(stopId) ?? trip.byStopSequence.get(stopSequence);

  if (exact) {
    return { delay: exact.delay, absoluteTime: exact.time };
  }

  // Callers that know where the stop falls in the trip (UNKNOWN_SEQUENCE when
  // they don't) inherit from the last enumerated stop before it. An absolute
  // time belongs to the stop that reported it, so only the delay carries.
  const known = stopSequence !== UNKNOWN_SEQUENCE;
  let inherited: number | undefined;

  for (const entry of trip.ordered) {
    if (known && (entry.stopSequence === undefined || entry.stopSequence > stopSequence)) break;
    inherited = entry.prediction.delay;
  }

  // Without a sequence, a trip-level delay describes the whole trip better
  // than the last stop update we happen to have seen.
  const delay = known ? (inherited ?? trip.delay) : (trip.delay ?? inherited);
  return delay === undefined ? null : { delay };
}

function buildPrediction(
  trip: TripRealtime | undefined,
  stopId: string,
  stopSequence: number,
  scheduledIso: string
): RealtimePrediction | undefined {
  if (!trip || trip.canceled) return undefined;

  const resolved = predictionForStop(trip, stopId, stopSequence);
  if (!resolved) return undefined;

  const predictedMs =
    resolved.absoluteTime !== undefined
      ? resolved.absoluteTime * 1000
      : new Date(scheduledIso).getTime() + resolved.delay * 1000;

  if (!Number.isFinite(predictedMs)) return undefined;

  return {
    delay_seconds: resolved.delay,
    predicted_time: new Date(predictedMs).toISOString(),
    status: statusFor(resolved.delay),
  };
}

/**
 * Departures leave from one known stop, but the schedule rows the API builds
 * don't carry that stop's sequence, so match on stop_id alone.
 */
export function enrichDepartures(
  departures: Departure[],
  stopId: string,
  snapshot: RealtimeSnapshot
): Departure[] {
  if (snapshot.fetchedAt === null) return departures;

  return departures.map((departure) => {
    const realtime = buildPrediction(
      snapshot.trips.get(departure.trip_id),
      stopId,
      UNKNOWN_SEQUENCE,
      departure.departure_time
    );
    return realtime ? { ...departure, realtime } : departure;
  });
}

export function enrichDirectTrips(
  trips: DirectTrip[],
  originStopId: string,
  destinationStopId: string,
  snapshot: RealtimeSnapshot
): DirectTrip[] {
  if (snapshot.fetchedAt === null) return trips;

  return trips.map((trip) => {
    const feedTrip = snapshot.trips.get(trip.trip_id);
    const realtime = buildPrediction(
      feedTrip,
      originStopId,
      UNKNOWN_SEQUENCE,
      trip.origin_departure
    );
    const realtimeArrival = buildPrediction(
      feedTrip,
      destinationStopId,
      UNKNOWN_SEQUENCE,
      trip.destination_arrival
    );

    if (!realtime && !realtimeArrival) return trip;
    return {
      ...trip,
      ...(realtime ? { realtime } : {}),
      ...(realtimeArrival ? { realtime_arrival: realtimeArrival } : {}),
    };
  });
}

export function enrichTripDetails(
  details: GetTripDetailsResponse,
  snapshot: RealtimeSnapshot
): GetTripDetailsResponse {
  if (snapshot.fetchedAt === null) return details;

  const feedTrip = snapshot.trips.get(details.trip_id);
  const feedVehicle = snapshot.vehicles.get(details.trip_id);

  const stops: TripStop[] = details.stops.map((stop) => {
    const realtime = buildPrediction(
      feedTrip,
      stop.stop.stop_id,
      stop.stop_sequence,
      stop.arrival_time
    );
    return realtime ? { ...stop, realtime } : stop;
  });

  const vehicle: VehiclePosition | undefined = feedVehicle
    ? {
        latitude: feedVehicle.latitude,
        longitude: feedVehicle.longitude,
        current_stop_sequence: feedVehicle.currentStopSequence,
        current_status: feedVehicle.currentStatus,
        timestamp: new Date(feedVehicle.timestamp * 1000).toISOString(),
      }
    : undefined;

  return { ...details, stops, ...(vehicle ? { vehicle } : {}) };
}
