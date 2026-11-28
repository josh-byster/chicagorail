/**
 * Typed rows of the GTFS files this app reads, decoded from CSV records.
 *
 * Every field is decoded by a Schema, so a malformed value is an error with
 * its file and line, never a silent NaN. Empty CSV fields count as absent,
 * which is how GTFS represents an unset optional field.
 */
import { Effect, Result, Schema } from "effect"
import * as Csv from "./Csv.ts"
import { RouteId, ServiceId, StopId, TripId } from "./Ids.ts"
import { GtfsTimeFromString, ServiceDateFromGtfs } from "./Time.ts"

export class GtfsFileError extends Schema.TaggedError<GtfsFileError>()("GtfsFileError", {
  file: Schema.String,
  line: Schema.Int,
  message: Schema.String
}) {}

const IntFromString = Schema.NumberFromString.check(Schema.isInt())
const FiniteFromString = Schema.FiniteFromString

/** An integer enum column with a default for when the column or value is absent */
const enumColumn = (values: ReadonlyArray<number>, defaultValue: number) =>
  IntFromString.check(
    Schema.makeFilter((n: number) => values.includes(n), { expected: `one of ${values.join(", ")}` })
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed(String(defaultValue))))

const optional = Schema.optionalKey

const Bit = IntFromString.check(
  Schema.makeFilter((n: number) => n === 0 || n === 1, { expected: "0 or 1" })
)

const HexColor = Schema.String.check(Schema.isPattern(/^[0-9A-Fa-f]{6}$/))

export const AgencyRow = Schema.Struct({
  agency_name: Schema.String,
  agency_timezone: Schema.NonEmptyString
})
export type AgencyRow = typeof AgencyRow.Type

export const RouteRow = Schema.Struct({
  route_id: RouteId,
  route_short_name: optional(Schema.String),
  route_long_name: optional(Schema.String),
  route_desc: optional(Schema.String),
  route_type: IntFromString,
  route_url: optional(Schema.String),
  route_color: optional(HexColor),
  route_text_color: optional(HexColor)
})
export type RouteRow = typeof RouteRow.Type

export const StopRow = Schema.Struct({
  stop_id: StopId,
  stop_name: Schema.NonEmptyString,
  stop_desc: optional(Schema.String),
  stop_lat: FiniteFromString.check(Schema.isBetween({ minimum: -90, maximum: 90 })),
  stop_lon: FiniteFromString.check(Schema.isBetween({ minimum: -180, maximum: 180 })),
  zone_id: optional(Schema.String),
  stop_url: optional(Schema.String),
  location_type: enumColumn([0, 1, 2, 3, 4], 0),
  parent_station: optional(StopId),
  wheelchair_boarding: enumColumn([0, 1, 2], 0)
})
export type StopRow = typeof StopRow.Type

export const TripRow = Schema.Struct({
  route_id: RouteId,
  service_id: ServiceId,
  trip_id: TripId,
  trip_headsign: optional(Schema.String),
  trip_short_name: optional(Schema.String),
  direction_id: optional(Bit),
  block_id: optional(Schema.String),
  shape_id: optional(Schema.String)
})
export type TripRow = typeof TripRow.Type

export const StopTimeRow = Schema.Struct({
  trip_id: TripId,
  arrival_time: GtfsTimeFromString,
  departure_time: GtfsTimeFromString,
  stop_id: StopId,
  stop_sequence: IntFromString.check(Schema.isGreaterThanOrEqualTo(0)),
  /** 0 regular, 1 none, 2 phone agency, 3 coordinate with driver */
  pickup_type: enumColumn([0, 1, 2, 3], 0),
  drop_off_type: enumColumn([0, 1, 2, 3], 0)
})
export type StopTimeRow = typeof StopTimeRow.Type

export const CalendarRow = Schema.Struct({
  service_id: ServiceId,
  monday: Bit,
  tuesday: Bit,
  wednesday: Bit,
  thursday: Bit,
  friday: Bit,
  saturday: Bit,
  sunday: Bit,
  start_date: ServiceDateFromGtfs,
  end_date: ServiceDateFromGtfs
})
export type CalendarRow = typeof CalendarRow.Type

export const CalendarDateRow = Schema.Struct({
  service_id: ServiceId,
  date: ServiceDateFromGtfs,
  /** 1 added, 2 removed */
  exception_type: IntFromString.check(
    Schema.makeFilter((n: number) => n === 1 || n === 2, { expected: "1 or 2" })
  )
})
export type CalendarDateRow = typeof CalendarDateRow.Type

/** Drop empty values so optional columns decode as absent */
const presentFields = (fields: Readonly<Record<string, string>>): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== "") out[key] = value
  }
  return out
}

/** Decode every record of one GTFS file, failing on the first bad row */
export const decodeTable = <S extends Schema.Decoder<unknown>>(
  file: string,
  text: string,
  schema: S
): Result.Result<ReadonlyArray<S["Type"]>, GtfsFileError> => {
  const decode = Schema.decodeUnknownResult(schema)
  return Result.flatMap(
    Result.mapError(Csv.parse(file, text), (e) => new GtfsFileError({ file, line: e.line, message: e.message })),
    (table) => {
      const rows: Array<S["Type"]> = []
      for (const record of table.records) {
        const decoded = decode(presentFields(record.fields))
        if (Result.isFailure(decoded)) {
          return Result.fail(new GtfsFileError({ file, line: record.line, message: decoded.failure.message }))
        }
        rows.push(decoded.success)
      }
      return Result.succeed(rows)
    }
  )
}

/** The raw text of each GTFS file, keyed by file name (e.g. "stops.txt") */
export type GtfsFiles = Readonly<Record<string, string>>

export interface GtfsTables {
  readonly agency: ReadonlyArray<AgencyRow>
  readonly routes: ReadonlyArray<RouteRow>
  readonly stops: ReadonlyArray<StopRow>
  readonly trips: ReadonlyArray<TripRow>
  readonly stopTimes: ReadonlyArray<StopTimeRow>
  readonly calendar: ReadonlyArray<CalendarRow>
  readonly calendarDates: ReadonlyArray<CalendarDateRow>
}

const required = (files: GtfsFiles, file: string): Result.Result<string, GtfsFileError> => {
  const text = files[file]
  return text === undefined
    ? Result.fail(new GtfsFileError({ file, line: 0, message: "Required file is missing from the feed" }))
    : Result.succeed(text)
}

/** Decode all tables. calendar.txt and calendar_dates.txt may each be absent, but not both. */
export const decodeTables = (files: GtfsFiles): Result.Result<GtfsTables, GtfsFileError> =>
  Result.gen(function*() {
    if (files["calendar.txt"] === undefined && files["calendar_dates.txt"] === undefined) {
      return yield* Result.fail(
        new GtfsFileError({ file: "calendar.txt", line: 0, message: "Feed has neither calendar.txt nor calendar_dates.txt" })
      )
    }
    const table = <S extends Schema.Decoder<unknown>>(file: string, schema: S) =>
      Result.flatMap(required(files, file), (text) => decodeTable(file, text, schema))
    const optionalTable = <S extends Schema.Decoder<unknown>>(file: string, schema: S) => {
      const text = files[file]
      return text === undefined ? Result.succeed([]) : decodeTable(file, text, schema)
    }
    return {
      agency: yield* table("agency.txt", AgencyRow),
      routes: yield* table("routes.txt", RouteRow),
      stops: yield* table("stops.txt", StopRow),
      trips: yield* table("trips.txt", TripRow),
      stopTimes: yield* table("stop_times.txt", StopTimeRow),
      calendar: yield* optionalTable("calendar.txt", CalendarRow),
      calendarDates: yield* optionalTable("calendar_dates.txt", CalendarDateRow)
    }
  })
