/**
 * Schedule queries over a built feed. All pure: "now" and every other input
 * is passed in.
 *
 * Time windows are in instants, not dates. A window can overlap several
 * service days (a 00:30 departure usually belongs to the previous day's
 * service as 24:30:00), so each query checks every service date that could
 * reach into the window, and keeps the events that actually fall inside it.
 */
import { Option, Result, Schema } from "effect"
import type { Feed, Route, Stop, StopTime, StopVisit, Trip } from "./Feed.ts"
import { runsOn } from "./Feed.ts"
import type { RouteId, StopId, TripId } from "./Ids.ts"
import * as Time from "./Time.ts"
import type { Instant, ServiceDate } from "./Time.ts"

export class StopNotFound extends Schema.TaggedError<StopNotFound>()("StopNotFound", {
  stopId: Schema.String
}) {}

export class RouteNotFound extends Schema.TaggedError<RouteNotFound>()("RouteNotFound", {
  routeId: Schema.String
}) {}

export class TripNotFound extends Schema.TaggedError<TripNotFound>()("TripNotFound", {
  tripId: Schema.String
}) {}

export class TripNotRunning extends Schema.TaggedError<TripNotRunning>()("TripNotRunning", {
  tripId: Schema.String,
  serviceDate: Schema.String
}) {}

/** Half-open: from <= t < to */
export interface Window {
  readonly from: Instant
  readonly to: Instant
}

export const findStop = (feed: Feed, id: StopId): Result.Result<Stop, StopNotFound> => {
  const stop = feed.stopsById.get(id)
  return stop === undefined ? Result.fail(new StopNotFound({ stopId: id })) : Result.succeed(stop)
}

export const findRoute = (feed: Feed, id: RouteId): Result.Result<Route, RouteNotFound> => {
  const route = feed.routesById.get(id)
  return route === undefined ? Result.fail(new RouteNotFound({ routeId: id })) : Result.succeed(route)
}

/** A rider can board here: not the last stop, and pickup is not "none" */
export const canBoard = (trip: Trip, index: number): boolean =>
  index < trip.stopTimes.length - 1 && (trip.stopTimes[index] as StopTime).pickupType !== 1

/** A rider can get off here: not the first stop, and drop off is not "none" */
export const canAlight = (trip: Trip, index: number): boolean =>
  index > 0 && (trip.stopTimes[index] as StopTime).dropOffType !== 1

/**
 * Every service date whose trips could have an event inside the window.
 *
 * A service day starts at noon minus 12h (local midnight, or 23:00/01:00 on a
 * DST day) and its times run up to `feed.maxTime`, so it can reach that many
 * days past its date. One extra day either side covers the DST shift.
 */
export const serviceDatesFor = (feed: Feed, window: Window): ReadonlyArray<ServiceDate> => {
  const first = Time.addDays(Time.localDateOf(window.from, feed.timeZone), -(Math.ceil(feed.maxTime / 86400) + 1))
  const last = Time.addDays(Time.localDateOf(window.to, feed.timeZone), 1)
  const dates: Array<ServiceDate> = []
  for (let d = first; d <= last; d = Time.addDays(d, 1)) dates.push(d)
  return dates
}

const inWindow = (window: Window, at: Instant) => at >= window.from && at < window.to

/** One call of a trip at a stop, on a specific service date */
export interface StopEvent {
  readonly trip: Trip
  readonly index: number
  readonly serviceDate: ServiceDate
  /** The scheduled instant of the event (departure or arrival, per the query) */
  readonly at: Instant
}

const byTime = (a: StopEvent, b: StopEvent) =>
  a.at - b.at || (a.trip.id < b.trip.id ? -1 : a.trip.id > b.trip.id ? 1 : 0) || a.index - b.index

export interface EventQuery {
  readonly window: Window
  readonly routeId?: RouteId | undefined
  readonly limit: number
}

const stopEvents = (
  feed: Feed,
  stopId: StopId,
  query: EventQuery,
  eligible: (trip: Trip, index: number) => boolean,
  timeOf: (st: StopTime) => Time.GtfsTime
): ReadonlyArray<StopEvent> => {
  const visits: ReadonlyArray<StopVisit> = feed.visitsByStop.get(stopId) ?? []
  const dates = serviceDatesFor(feed, query.window)
  const events: Array<StopEvent> = []
  for (const { index, trip } of visits) {
    if (query.routeId !== undefined && trip.routeId !== query.routeId) continue
    if (!eligible(trip, index)) continue
    const st = trip.stopTimes[index] as StopTime
    for (const serviceDate of dates) {
      if (!runsOn(feed, trip, serviceDate)) continue
      const at = Time.instantOf(serviceDate, timeOf(st), feed.timeZone)
      if (inWindow(query.window, at)) events.push({ trip, index, serviceDate, at })
    }
  }
  return events.sort(byTime).slice(0, query.limit)
}

/** Trains a rider can board at a stop, by scheduled departure */
export const departures = (feed: Feed, stopId: StopId, query: EventQuery): ReadonlyArray<StopEvent> =>
  stopEvents(feed, stopId, query, canBoard, (st) => st.departure)

/** Trains a rider can get off at a stop, by scheduled arrival */
export const arrivals = (feed: Feed, stopId: StopId, query: EventQuery): ReadonlyArray<StopEvent> =>
  stopEvents(feed, stopId, query, canAlight, (st) => st.arrival)

/** A ride on one trip from an origin to a destination */
export interface DirectTrip {
  readonly trip: Trip
  readonly serviceDate: ServiceDate
  readonly fromIndex: number
  readonly toIndex: number
  readonly departAt: Instant
  readonly arriveAt: Instant
}

/** Direct trains (no transfers) from origin to destination, departing in the window */
export const directTrips = (
  feed: Feed,
  origin: StopId,
  destination: StopId,
  query: { readonly window: Window; readonly limit: number }
): ReadonlyArray<DirectTrip> => {
  const results: Array<DirectTrip> = []
  for (const event of departures(feed, origin, { window: query.window, limit: Number.POSITIVE_INFINITY })) {
    const { trip } = event
    const toIndex = trip.stopTimes.findIndex((st, i) => i > event.index && st.stopId === destination && canAlight(trip, i))
    if (toIndex === -1) continue
    results.push({
      trip,
      serviceDate: event.serviceDate,
      fromIndex: event.index,
      toIndex,
      departAt: event.at,
      arriveAt: Time.instantOf(event.serviceDate, (trip.stopTimes[toIndex] as StopTime).arrival, feed.timeZone)
    })
  }
  return results
    .sort((a, b) => a.departAt - b.departAt || a.arriveAt - b.arriveAt || (a.trip.id < b.trip.id ? -1 : 1))
    .slice(0, query.limit)
}

/** One trip on one service date, with every call resolved to instants */
export interface TripInstance {
  readonly trip: Trip
  readonly serviceDate: ServiceDate
  readonly calls: ReadonlyArray<{
    readonly index: number
    readonly stopTime: StopTime
    readonly arriveAt: Instant
    readonly departAt: Instant
  }>
}

export const tripInstance = (
  feed: Feed,
  tripId: TripId,
  serviceDate: ServiceDate
): Result.Result<TripInstance, TripNotFound | TripNotRunning> => {
  const trip = feed.tripsById.get(tripId)
  if (trip === undefined) return Result.fail(new TripNotFound({ tripId }))
  if (!runsOn(feed, trip, serviceDate)) return Result.fail(new TripNotRunning({ tripId, serviceDate }))
  return Result.succeed({
    trip,
    serviceDate,
    calls: trip.stopTimes.map((stopTime, index) => ({
      index,
      stopTime,
      arriveAt: Time.instantOf(serviceDate, stopTime.arrival, feed.timeZone),
      departAt: Time.instantOf(serviceDate, stopTime.departure, feed.timeZone)
    }))
  })
}

/**
 * Stops served directly (one trip, no transfer) on a service date, when `stopId`
 * is the origin (stops you can ride to) or the destination (stops you can ride from).
 */
export const reachableStops = (
  feed: Feed,
  stopId: StopId,
  role: "origin" | "destination",
  serviceDate: ServiceDate
): ReadonlySet<StopId> => {
  const reachable = new Set<StopId>()
  for (const { index, trip } of feed.visitsByStop.get(stopId) ?? []) {
    if (!runsOn(feed, trip, serviceDate)) continue
    if (role === "origin" ? !canBoard(trip, index) : !canAlight(trip, index)) continue
    trip.stopTimes.forEach((st, i) => {
      if (st.stopId === stopId) return
      if (role === "origin" ? i > index && canAlight(trip, i) : i < index && canBoard(trip, i)) reachable.add(st.stopId)
    })
  }
  return reachable
}

// ---------------------------------------------------------------------------
// Stop search
// ---------------------------------------------------------------------------

/** Lowercase, strip accents and punctuation, collapse spaces */
export const normalize = (s: string): string =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

const matchScore = (stop: Stop, q: string): Option.Option<number> => {
  const name = normalize(stop.name)
  if (name === q || normalize(stop.id) === q) return Option.some(0)
  if (name.startsWith(q)) return Option.some(1)
  if (name.split(" ").some((word) => word.startsWith(q))) return Option.some(2)
  if (name.includes(q)) return Option.some(3)
  return Option.none()
}

/** Stops whose name or id matches the query, best matches first */
export const searchStops = (feed: Feed, query: string): ReadonlyArray<Stop> => {
  const q = normalize(query)
  if (q === "") return []
  return feed.stops
    .flatMap((stop) => Option.match(matchScore(stop, q), { onNone: () => [], onSome: (score) => [{ stop, score }] }))
    .sort((a, b) => a.score - b.score || a.stop.name.localeCompare(b.stop.name))
    .map(({ stop }) => stop)
}

/** Great-circle distance in meters */
export const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLon = (lon2 - lon1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6_371_008.8 * Math.asin(Math.min(1, Math.sqrt(a)))
}

// ---------------------------------------------------------------------------
// Route patterns
// ---------------------------------------------------------------------------

/** A distinct sequence of stops that some of a route's trips follow */
export interface Pattern {
  readonly directionId: number | undefined
  readonly stopIds: ReadonlyArray<StopId>
  /** Most common headsign among the pattern's trips */
  readonly headsign: string | undefined
  readonly tripCount: number
}

export const routePatterns = (feed: Feed, routeId: RouteId): ReadonlyArray<Pattern> => {
  const groups = new Map<string, { directionId: number | undefined; stopIds: ReadonlyArray<StopId>; trips: Array<Trip> }>()
  for (const trip of feed.tripsById.values()) {
    if (trip.routeId !== routeId) continue
    const stopIds = trip.stopTimes.map((st) => st.stopId)
    const key = `${trip.directionId ?? ""}|${stopIds.join(">")}`
    const group = groups.get(key) ?? { directionId: trip.directionId, stopIds, trips: [] }
    group.trips.push(trip)
    groups.set(key, group)
  }
  return [...groups.values()]
    .map(({ directionId, stopIds, trips }) => {
      const counts = new Map<string, number>()
      for (const t of trips) if (t.headsign !== undefined) counts.set(t.headsign, (counts.get(t.headsign) ?? 0) + 1)
      const headsign = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
      return { directionId, stopIds, headsign, tripCount: trips.length }
    })
    .sort((a, b) =>
      (a.directionId ?? -1) - (b.directionId ?? -1) || b.tripCount - a.tripCount || b.stopIds.length - a.stopIds.length
    )
}
