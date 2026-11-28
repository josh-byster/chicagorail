/**
 * Live predictions from GTFS-realtime, merged onto scheduled events.
 *
 * The feed types here are already decoded (protobuf decoding happens at the
 * edge, in the API). Everything in this module is pure.
 *
 * Matching follows the GTFS-realtime reference:
 * - A trip update applies to the trip instance with the same trip_id and
 *   start_date. Without a start_date, it applies to the instance running
 *   around the time the feed was produced.
 * - A stop's own update wins; it is matched by stop_sequence, or by stop_id
 *   when the trip visits that stop only once.
 * - A stop without its own update inherits the delay of the closest earlier
 *   stop that has one (unless that stop said NO_DATA), and failing that the
 *   trip-level delay.
 */
import type { Feed, StopTime, Trip } from "./Feed.ts"
import type { StopId, TripId } from "./Ids.ts"
import * as Time from "./Time.ts"
import type { Instant, ServiceDate } from "./Time.ts"

export interface StopTimeEvent {
  /** Seconds late; negative is early */
  readonly delay?: number | undefined
  /** Predicted absolute time, epoch seconds */
  readonly time?: number | undefined
}

export interface StopTimeUpdate {
  readonly stopSequence?: number | undefined
  readonly stopId?: StopId | undefined
  readonly arrival?: StopTimeEvent | undefined
  readonly departure?: StopTimeEvent | undefined
  readonly relationship: "scheduled" | "skipped" | "no_data"
}

export interface TripUpdate {
  readonly tripId: TripId
  readonly startDate?: ServiceDate | undefined
  readonly canceled: boolean
  /** Trip-level delay in seconds */
  readonly delay?: number | undefined
  /** Ordered by stop_sequence where known */
  readonly stopTimeUpdates: ReadonlyArray<StopTimeUpdate>
}

export interface VehiclePosition {
  readonly tripId: TripId
  readonly startDate?: ServiceDate | undefined
  readonly latitude: number
  readonly longitude: number
  readonly bearing?: number | undefined
  readonly currentStopSequence?: number | undefined
  readonly stopId?: StopId | undefined
  readonly currentStatus?: "incoming_at" | "stopped_at" | "in_transit_to" | undefined
  /** When the position was measured */
  readonly timestamp: Instant
}

export interface Snapshot {
  readonly fetchedAt: Instant
  readonly tripUpdates: ReadonlyMap<TripId, ReadonlyArray<TripUpdate>>
  readonly vehicles: ReadonlyMap<TripId, ReadonlyArray<VehiclePosition>>
}

export const emptySnapshot = (fetchedAt: Instant): Snapshot => ({
  fetchedAt,
  tripUpdates: new Map(),
  vehicles: new Map()
})

/** How a scheduled event is actually running */
export type Prediction =
  | { readonly state: "scheduled" }
  | { readonly state: "canceled" }
  | { readonly state: "skipped" }
  | {
    readonly state: "on_time" | "late" | "early"
    readonly delaySeconds: number
    readonly predictedAt: Instant
  }

/** Under a minute either way still counts as on time */
export const ON_TIME_THRESHOLD_SECONDS = 60

const statusOf = (delaySeconds: number): "on_time" | "late" | "early" =>
  Math.abs(delaySeconds) < ON_TIME_THRESHOLD_SECONDS ? "on_time" : delaySeconds > 0 ? "late" : "early"

const SCHEDULED: Prediction = { state: "scheduled" }

/** Updates without a start_date apply to the instance scheduled within this long of the feed time */
const UNDATED_MATCH_HOURS = 6

const tripSpan = (feed: Feed, trip: Trip, serviceDate: ServiceDate) => {
  const first = trip.stopTimes[0] as StopTime
  const last = trip.stopTimes[trip.stopTimes.length - 1] as StopTime
  return {
    start: Time.instantOf(serviceDate, first.departure, feed.timeZone),
    end: Time.instantOf(serviceDate, last.arrival, feed.timeZone)
  }
}

/** The trip update that applies to one trip instance, if any */
export const updateFor = (
  feed: Feed,
  snapshot: Snapshot,
  trip: Trip,
  serviceDate: ServiceDate
): TripUpdate | undefined => {
  const updates = snapshot.tripUpdates.get(trip.id) ?? []
  const dated = updates.find((u) => u.startDate === serviceDate)
  if (dated !== undefined) return dated
  const undated = updates.find((u) => u.startDate === undefined)
  if (undated === undefined) return undefined
  const { end, start } = tripSpan(feed, trip, serviceDate)
  const slack = UNDATED_MATCH_HOURS * 3600 * 1000
  return snapshot.fetchedAt >= start - slack && snapshot.fetchedAt <= end + slack ? undated : undefined
}

/** The vehicle position for one trip instance, matched like trip updates */
export const vehicleFor = (
  feed: Feed,
  snapshot: Snapshot,
  trip: Trip,
  serviceDate: ServiceDate
): VehiclePosition | undefined => {
  const vehicles = snapshot.vehicles.get(trip.id) ?? []
  const dated = vehicles.find((v) => v.startDate === serviceDate)
  if (dated !== undefined) return dated
  const undated = vehicles.find((v) => v.startDate === undefined)
  if (undated === undefined) return undefined
  const { end, start } = tripSpan(feed, trip, serviceDate)
  const slack = UNDATED_MATCH_HOURS * 3600 * 1000
  return snapshot.fetchedAt >= start - slack && snapshot.fetchedAt <= end + slack ? undated : undefined
}

const ownUpdate = (trip: Trip, index: number, update: TripUpdate): StopTimeUpdate | undefined => {
  const st = trip.stopTimes[index] as StopTime
  const bySequence = update.stopTimeUpdates.find((u) => u.stopSequence === st.sequence)
  if (bySequence !== undefined) return bySequence
  const visitsHere = trip.stopTimes.filter((s) => s.stopId === st.stopId).length
  return visitsHere === 1
    ? update.stopTimeUpdates.find((u) => u.stopSequence === undefined && u.stopId === st.stopId)
    : undefined
}

/** Position of an update within the trip, or -1 when it can't be placed */
const indexOfUpdate = (trip: Trip, u: StopTimeUpdate): number =>
  u.stopSequence !== undefined
    ? trip.stopTimes.findIndex((st) => st.sequence === u.stopSequence)
    : trip.stopTimes.filter((st) => st.stopId === u.stopId).length === 1
    ? trip.stopTimes.findIndex((st) => st.stopId === u.stopId)
    : -1

/** Delay an update states for its own stop, deriving it from an absolute time if needed */
const delayOf = (
  event: StopTimeEvent | undefined,
  scheduledAt: Instant
): number | undefined =>
  event?.delay ?? (event?.time !== undefined ? Math.round((event.time * 1000 - scheduledAt) / 1000) : undefined)

/**
 * The prediction for one event of one trip instance.
 *
 * `kind` picks the arrival or the departure at that call; a stop update with
 * only the other event falls back to it, as the reference allows.
 */
export const predict = (
  feed: Feed,
  snapshot: Snapshot,
  trip: Trip,
  serviceDate: ServiceDate,
  index: number,
  kind: "arrival" | "departure"
): Prediction => {
  const update = updateFor(feed, snapshot, trip, serviceDate)
  if (update === undefined) return SCHEDULED
  if (update.canceled) return { state: "canceled" }

  const scheduledAt = (i: number, k: "arrival" | "departure"): Instant => {
    const st = trip.stopTimes[i] as StopTime
    return Time.instantOf(serviceDate, k === "arrival" ? st.arrival : st.departure, feed.timeZone)
  }
  const scheduled = scheduledAt(index, kind)
  const resolved = (delaySeconds: number, predictedAt: Instant): Prediction => ({
    state: statusOf(delaySeconds),
    delaySeconds,
    predictedAt
  })

  const own = ownUpdate(trip, index, update)
  if (own !== undefined) {
    if (own.relationship === "skipped") return { state: "skipped" }
    if (own.relationship === "no_data") return SCHEDULED
    const event = kind === "arrival" ? own.arrival ?? own.departure : own.departure ?? own.arrival
    if (event?.time !== undefined) {
      const predictedAt = Time.instantFromMillis(event.time * 1000)
      return resolved(event.delay ?? Math.round((predictedAt - scheduled) / 1000), predictedAt)
    }
    if (event?.delay !== undefined) {
      return resolved(event.delay, Time.instantFromMillis(scheduled + event.delay * 1000))
    }
  }

  // Inherit from the closest earlier stop with an update
  const earlier = update.stopTimeUpdates
    .map((u) => ({ u, i: indexOfUpdate(trip, u) }))
    .filter(({ i }) => i !== -1 && i < index)
    .sort((a, b) => b.i - a.i)[0]
  if (earlier !== undefined) {
    if (earlier.u.relationship === "no_data") return SCHEDULED
    // A skipped stop carries no timing; keep looking past it would guess, so fall through to trip delay
    if (earlier.u.relationship === "scheduled") {
      const event = earlier.u.departure ?? earlier.u.arrival
      const kindThere = earlier.u.departure !== undefined ? "departure" : "arrival"
      const delay = delayOf(event, scheduledAt(earlier.i, kindThere))
      if (delay !== undefined) return resolved(delay, Time.instantFromMillis(scheduled + delay * 1000))
    }
  }

  if (update.delay !== undefined) {
    return resolved(update.delay, Time.instantFromMillis(scheduled + update.delay * 1000))
  }
  return SCHEDULED
}
