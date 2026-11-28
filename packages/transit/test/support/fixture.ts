/**
 * A small hand-written feed covering the edge cases the queries must get right.
 *
 * Stops: A Aurora, B Naperville, C Western Ave, D Chicago Union Station.
 * 2026-11-27 is a Friday; 2026-11-26 is Thanksgiving.
 */
import { Result, Schema } from "effect"
import * as Feed from "../../src/Feed.ts"
import * as Gtfs from "../../src/Gtfs.ts"
import { RouteId, StopId, TripId } from "../../src/Ids.ts"
import * as Time from "../../src/Time.ts"

export const files: Gtfs.GtfsFiles = {
  "agency.txt": "agency_name,agency_timezone\nTest Rail,America/Chicago\n",
  "routes.txt": [
    "route_id,route_short_name,route_long_name,route_type,route_color,route_text_color",
    "R1,R1,Line One,2,a1b2c3,FFFFFF",
    "R2,R2,Line Two,2,,"
  ].join("\n"),
  "stops.txt": [
    "stop_id,stop_name,stop_lat,stop_lon,wheelchair_boarding",
    "A,Aurora,41.76,-88.31,1",
    "B,Naperville,41.78,-88.15,1",
    "C,Western Ave,41.85,-87.69,",
    "D,\"Chicago Union Station\",41.88,-87.64,1"
  ].join("\n"),
  "calendar.txt": [
    "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
    "WK,1,1,1,1,1,0,0,20260101,20261231",
    "SA,0,0,0,0,0,1,0,20260101,20261231",
    "DLY,1,1,1,1,1,1,1,20260101,20261231"
  ].join("\n"),
  "calendar_dates.txt": [
    "service_id,date,exception_type",
    // Thanksgiving: no weekday service, Saturday service instead
    "WK,20261126,2",
    "SA,20261126,1",
    // Defined only by calendar_dates
    "HOL,20261225,1"
  ].join("\n"),
  "trips.txt": [
    "route_id,service_id,trip_id,trip_headsign,direction_id",
    "R1,WK,T1,Chicago Union Station,1",
    "R1,WK,T2,Chicago Union Station,1",
    "R1,WK,T3,Chicago Union Station,1",
    "R2,SA,T4,Aurora,0",
    "R2,WK,T5,Western Ave,1",
    "R1,HOL,T6,Chicago Union Station,1",
    "R1,DLY,T7,Naperville,1"
  ].join("\n"),
  "stop_times.txt": [
    "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type",
    // Evening train: the old API checked these against the wrong date after 6 PM
    "T1,18:30:00,18:30:00,A,1,0,0",
    "T1,18:40:00,18:41:00,B,2,0,0",
    "T1,18:50:00,18:50:00,C,3,0,0",
    "T1,19:00:00,19:00:00,D,4,0,0",
    // Late train that runs past midnight
    "T2,23:50:00,23:50:00,A,1,0,0",
    "T2,24:05:00,24:05:00,B,2,0,0",
    "T2,24:20:00,24:20:00,C,3,0,0",
    "T2,24:40:00,24:40:00,D,4,0,0",
    // Pickup restrictions: B is drop-off only, C is pickup only
    "T3,07:00:00,07:00:00,A,1,0,0",
    "T3,07:10:00,07:10:00,B,2,1,0",
    "T3,07:20:00,07:20:00,C,3,0,1",
    "T3,07:30:00,07:30:00,D,4,0,0",
    // Saturday service in the other direction
    "T4,09:00:00,09:00:00,D,1,0,0",
    "T4,09:10:00,09:10:00,C,2,0,0",
    "T4,09:20:00,09:20:00,B,3,0,0",
    "T4,09:30:00,09:30:00,A,4,0,0",
    // Loop trip that visits A twice
    "T5,10:00:00,10:00:00,A,1,0,0",
    "T5,10:10:00,10:10:00,B,2,0,0",
    "T5,10:20:00,10:20:00,A,3,0,0",
    "T5,10:30:00,10:30:00,C,4,0,0",
    // Christmas only
    "T6,12:00:00,12:00:00,A,1,0,0",
    "T6,12:30:00,12:30:00,D,2,0,0",
    // Every day, for daylight saving checks
    "T7,08:00:00,08:00:00,A,1,0,0",
    "T7,08:10:00,08:10:00,B,2,0,0"
  ].join("\n")
}

export const build = (overrides: Partial<Record<string, string>> = {}) =>
  Result.flatMap(
    Result.mapError(Gtfs.decodeTables({ ...files, ...overrides } as Gtfs.GtfsFiles), (e) => e as Gtfs.GtfsFileError | Feed.FeedError),
    (tables) => Feed.build("fixture", tables)
  )

export const feed: Feed.Feed = Result.getOrThrow(build())

export const stop = (s: string) => Schema.decodeSync(StopId)(s)
export const trip = (s: string) => Schema.decodeSync(TripId)(s)
export const route = (s: string) => Schema.decodeSync(RouteId)(s)
export const date = (s: string) => Schema.decodeSync(Time.ServiceDate)(s)

/** An instant from local Chicago wall-clock time, e.g. at("2026-11-27", "18:00") */
export const at = (d: string, hhmm: string) =>
  Time.instantOf(date(d), Schema.decodeSync(Time.GtfsTimeFromString)(`${hhmm}:00`), feed.timeZone)

export const iso = (instant: Time.Instant) => Time.formatInstant(instant, feed.timeZone)
