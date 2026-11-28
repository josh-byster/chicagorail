/**
 * An immutable, indexed snapshot of one GTFS feed.
 *
 * `build` checks the feed's integrity up front (every reference resolves,
 * every trip has ordered stop times, the agency time zone is real), so the
 * queries can treat the data as trusted. A feed that fails any check is
 * rejected as a whole; the API keeps serving the previous one.
 */
import { DateTime, Option, Result, Schema } from "effect"
import type * as Gtfs from "./Gtfs.ts"
import type { RouteId, ServiceId, StopId, TripId } from "./Ids.ts"
import * as Time from "./Time.ts"
import type { GtfsTime, ServiceDate } from "./Time.ts"

export class FeedError extends Schema.TaggedError<FeedError>()("FeedError", {
  message: Schema.String
}) {}

export interface Route {
  readonly id: RouteId
  readonly shortName: string | undefined
  readonly longName: string | undefined
  readonly description: string | undefined
  readonly type: number
  readonly url: string | undefined
  /** Six hex digits, no leading # */
  readonly color: string | undefined
  readonly textColor: string | undefined
}

export interface Stop {
  readonly id: StopId
  readonly name: string
  readonly description: string | undefined
  readonly lat: number
  readonly lon: number
  readonly zoneId: string | undefined
  readonly url: string | undefined
  readonly locationType: number
  readonly parentStation: StopId | undefined
  /** 0 unknown, 1 accessible, 2 not accessible */
  readonly wheelchairBoarding: number
}

export interface StopTime {
  readonly stopId: StopId
  readonly sequence: number
  readonly arrival: GtfsTime
  readonly departure: GtfsTime
  /** 0 regular, 1 none, 2 phone agency, 3 coordinate with driver */
  readonly pickupType: number
  readonly dropOffType: number
}

export interface Trip {
  readonly id: TripId
  readonly routeId: RouteId
  readonly serviceId: ServiceId
  readonly headsign: string | undefined
  readonly shortName: string | undefined
  readonly directionId: number | undefined
  readonly blockId: string | undefined
  /** Ordered by stop_sequence; always at least two */
  readonly stopTimes: ReadonlyArray<StopTime>
}

/** A trip calling at a stop: `trip.stopTimes[index]` is the call */
export interface StopVisit {
  readonly trip: Trip
  readonly index: number
}

export interface Service {
  readonly id: ServiceId
  /** Weekly pattern from calendar.txt, indexed Sunday (0) to Saturday (6); absent when only calendar_dates.txt defines it */
  readonly weekly: Option.Option<{
    readonly days: ReadonlyArray<boolean>
    readonly start: ServiceDate
    readonly end: ServiceDate
  }>
  readonly added: ReadonlySet<ServiceDate>
  readonly removed: ReadonlySet<ServiceDate>
}

export interface Feed {
  /** Identifies this feed's content, e.g. a hash of the downloaded archive */
  readonly version: string
  readonly agencyName: string
  readonly timeZone: DateTime.TimeZone
  readonly timeZoneId: string
  /** In feed order */
  readonly routes: ReadonlyArray<Route>
  readonly routesById: ReadonlyMap<RouteId, Route>
  /** In feed order */
  readonly stops: ReadonlyArray<Stop>
  readonly stopsById: ReadonlyMap<StopId, Stop>
  readonly tripsById: ReadonlyMap<TripId, Trip>
  /** Every visit to each stop */
  readonly visitsByStop: ReadonlyMap<StopId, ReadonlyArray<StopVisit>>
  /** Routes with at least one trip calling at each stop */
  readonly routesByStop: ReadonlyMap<StopId, ReadonlySet<RouteId>>
  readonly servicesById: ReadonlyMap<ServiceId, Service>
  /** Latest stop time in the feed, so queries know how far back a service day can reach */
  readonly maxTime: GtfsTime
  /** First and last service dates any service runs */
  readonly validity: { readonly start: ServiceDate; readonly end: ServiceDate }
}

/** Whether a service runs on a date, per calendar.txt and calendar_dates.txt */
export const isServiceActive = (service: Service, date: ServiceDate): boolean => {
  if (service.removed.has(date)) return false
  if (service.added.has(date)) return true
  return Option.match(service.weekly, {
    onNone: () => false,
    onSome: ({ days, end, start }) => date >= start && date <= end && days[Time.dayOfWeek(date)] === true
  })
}

/** Whether a trip runs on a service date. Total over a built feed: every trip's service exists. */
export const runsOn = (feed: Feed, trip: Trip, date: ServiceDate): boolean => {
  const service = feed.servicesById.get(trip.serviceId)
  return service !== undefined && isServiceActive(service, date)
}

const fail = (message: string) => Result.fail(new FeedError({ message }))

const uniqueBy = <A>(items: ReadonlyArray<A>, key: (a: A) => string, what: string) => {
  const map = new Map<string, A>()
  for (const item of items) {
    const k = key(item)
    if (map.has(k)) return fail(`Duplicate ${what} "${k}"`)
    map.set(k, item)
  }
  return Result.succeed(map)
}

const resolveTimeZone = (agencies: ReadonlyArray<Gtfs.AgencyRow>) => {
  const zones = new Set(agencies.map((a) => a.agency_timezone))
  const [first] = agencies
  if (first === undefined) return fail("agency.txt has no agencies")
  if (zones.size > 1) return fail(`Agencies use different time zones: ${[...zones].join(", ")}`)
  return Option.match(DateTime.zoneMakeNamed(first.agency_timezone), {
    onNone: () => fail(`Unknown agency time zone "${first.agency_timezone}"`),
    onSome: (zone) => Result.succeed({ zone, id: first.agency_timezone, name: first.agency_name })
  })
}

const buildServices = (tables: Gtfs.GtfsTables) => {
  const weekly = new Map<ServiceId, NonNullable<Option.Option.Value<Service["weekly"]>>>()
  for (const row of tables.calendar) {
    if (weekly.has(row.service_id)) return fail(`Duplicate service "${row.service_id}" in calendar.txt`)
    if (row.end_date < row.start_date) return fail(`Service "${row.service_id}" ends before it starts`)
    weekly.set(row.service_id, {
      days: [row.sunday, row.monday, row.tuesday, row.wednesday, row.thursday, row.friday, row.saturday].map(
        (d) => d === 1
      ),
      start: row.start_date,
      end: row.end_date
    })
  }
  const added = new Map<ServiceId, Set<ServiceDate>>()
  const removed = new Map<ServiceId, Set<ServiceDate>>()
  for (const row of tables.calendarDates) {
    const target = row.exception_type === 1 ? added : removed
    const other = row.exception_type === 1 ? removed : added
    if (other.get(row.service_id)?.has(row.date) === true) {
      return fail(`Service "${row.service_id}" is both added and removed on ${row.date}`)
    }
    const set = target.get(row.service_id) ?? new Set<ServiceDate>()
    set.add(row.date)
    target.set(row.service_id, set)
  }
  const ids = new Set<ServiceId>([...weekly.keys(), ...added.keys(), ...removed.keys()])
  const services = new Map<ServiceId, Service>()
  for (const id of ids) {
    services.set(id, {
      id,
      weekly: Option.fromUndefinedOr(weekly.get(id)),
      added: added.get(id) ?? new Set(),
      removed: removed.get(id) ?? new Set()
    })
  }
  return Result.succeed(services)
}

const validity = (services: ReadonlyMap<ServiceId, Service>) => {
  const dates: Array<ServiceDate> = []
  for (const service of services.values()) {
    Option.map(service.weekly, ({ end, start }) => dates.push(start, end))
    dates.push(...service.added)
  }
  dates.sort()
  const start = dates[0]
  const end = dates[dates.length - 1]
  return start === undefined || end === undefined
    ? fail("No service dates in the feed")
    : Result.succeed({ start, end })
}

/** Build and validate a feed from decoded tables */
export const build = (version: string, tables: Gtfs.GtfsTables): Result.Result<Feed, FeedError> =>
  Result.gen(function*() {
    const agency = yield* resolveTimeZone(tables.agency)

    const routes: ReadonlyArray<Route> = tables.routes.map((r) => ({
      id: r.route_id,
      shortName: r.route_short_name,
      longName: r.route_long_name,
      description: r.route_desc,
      type: r.route_type,
      url: r.route_url,
      color: r.route_color?.toUpperCase(),
      textColor: r.route_text_color?.toUpperCase()
    }))
    const routesById = (yield* uniqueBy(routes, (r) => r.id, "route")) as Map<RouteId, Route>

    const stops: ReadonlyArray<Stop> = tables.stops.map((s) => ({
      id: s.stop_id,
      name: s.stop_name,
      description: s.stop_desc,
      lat: s.stop_lat,
      lon: s.stop_lon,
      zoneId: s.zone_id,
      url: s.stop_url,
      locationType: s.location_type,
      parentStation: s.parent_station,
      wheelchairBoarding: s.wheelchair_boarding
    }))
    const stopsById = (yield* uniqueBy(stops, (s) => s.id, "stop")) as Map<StopId, Stop>
    for (const stop of stops) {
      if (stop.parentStation !== undefined && !stopsById.has(stop.parentStation)) {
        return yield* fail(`Stop "${stop.id}" has unknown parent station "${stop.parentStation}"`)
      }
    }

    const servicesById = yield* buildServices(tables)

    // Group stop times by trip, checking each reference
    const tripRows = (yield* uniqueBy(tables.trips, (t) => t.trip_id, "trip")) as Map<TripId, Gtfs.TripRow>
    const timesByTrip = new Map<TripId, Array<StopTime>>()
    let maxTime = 0
    for (const st of tables.stopTimes) {
      if (!tripRows.has(st.trip_id)) return yield* fail(`stop_times.txt references unknown trip "${st.trip_id}"`)
      const stop = stopsById.get(st.stop_id)
      if (stop === undefined) return yield* fail(`stop_times.txt references unknown stop "${st.stop_id}"`)
      if (stop.locationType !== 0) {
        return yield* fail(`Trip "${st.trip_id}" calls at "${st.stop_id}", which is not a boarding location`)
      }
      if (st.departure_time < st.arrival_time) {
        return yield* fail(`Trip "${st.trip_id}" departs ${st.stop_id} before arriving`)
      }
      const list = timesByTrip.get(st.trip_id) ?? []
      list.push({
        stopId: st.stop_id,
        sequence: st.stop_sequence,
        arrival: st.arrival_time,
        departure: st.departure_time,
        pickupType: st.pickup_type,
        dropOffType: st.drop_off_type
      })
      timesByTrip.set(st.trip_id, list)
      maxTime = Math.max(maxTime, st.departure_time, st.arrival_time)
    }

    const tripsById = new Map<TripId, Trip>()
    for (const row of tripRows.values()) {
      if (!routesById.has(row.route_id)) return yield* fail(`Trip "${row.trip_id}" has unknown route "${row.route_id}"`)
      if (!servicesById.has(row.service_id)) {
        return yield* fail(`Trip "${row.trip_id}" has unknown service "${row.service_id}"`)
      }
      const stopTimes = (timesByTrip.get(row.trip_id) ?? []).sort((a, b) => a.sequence - b.sequence)
      if (stopTimes.length < 2) return yield* fail(`Trip "${row.trip_id}" has fewer than two stop times`)
      for (let i = 1; i < stopTimes.length; i++) {
        const prev = stopTimes[i - 1] as StopTime
        const curr = stopTimes[i] as StopTime
        if (curr.sequence === prev.sequence) {
          return yield* fail(`Trip "${row.trip_id}" repeats stop_sequence ${curr.sequence}`)
        }
        if (curr.arrival < prev.departure) {
          return yield* fail(`Trip "${row.trip_id}" goes back in time at stop_sequence ${curr.sequence}`)
        }
      }
      tripsById.set(row.trip_id, {
        id: row.trip_id,
        routeId: row.route_id,
        serviceId: row.service_id,
        headsign: row.trip_headsign,
        shortName: row.trip_short_name,
        directionId: row.direction_id,
        blockId: row.block_id,
        stopTimes
      })
    }

    const visitsByStop = new Map<StopId, Array<StopVisit>>()
    const routesByStop = new Map<StopId, Set<RouteId>>()
    for (const trip of tripsById.values()) {
      trip.stopTimes.forEach((st, index) => {
        const visits = visitsByStop.get(st.stopId) ?? []
        visits.push({ trip, index })
        visitsByStop.set(st.stopId, visits)
        const routeSet = routesByStop.get(st.stopId) ?? new Set<RouteId>()
        routeSet.add(trip.routeId)
        routesByStop.set(st.stopId, routeSet)
      })
    }

    return {
      version,
      agencyName: agency.name,
      timeZone: agency.zone,
      timeZoneId: agency.id,
      routes,
      routesById,
      stops,
      stopsById,
      tripsById,
      visitsByStop,
      routesByStop,
      servicesById,
      maxTime: maxTime as GtfsTime,
      validity: yield* validity(servicesById)
    }
  })
