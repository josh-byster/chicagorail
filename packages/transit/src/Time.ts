/**
 * The three notions of time a GTFS schedule needs, kept apart by type.
 *
 * - `ServiceDate`: the calendar day a trip's service belongs to (YYYY-MM-DD).
 *   A trip that leaves at 00:30 can belong to the previous day's service.
 * - `GtfsTime`: seconds after "noon minus 12 hours" on the service date, as the
 *   GTFS reference defines stop times. Values of 24:00:00 and later are valid.
 * - `Instant`: an absolute point in time, in epoch milliseconds.
 *
 * Calendar arithmetic is done on day numbers (days since 1970-01-01), so it
 * never touches a time zone. Only `instantOf` and `serviceDateOf` consult the
 * agency's time zone, and they do it through `DateTime`.
 */
import { DateTime, Schema, SchemaTransformation } from "effect"

// ---------------------------------------------------------------------------
// Day numbers: proleptic Gregorian calendar, days since 1970-01-01.
// Algorithms from Howard Hinnant, "chrono-Compatible Low-Level Date Algorithms".
// ---------------------------------------------------------------------------

export interface CivilDate {
  readonly year: number
  /** 1 to 12 */
  readonly month: number
  /** 1 to 31 */
  readonly day: number
}

export const daysFromCivil = ({ day, month, year }: CivilDate): number => {
  const y = month <= 2 ? year - 1 : year
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const mp = (month + 9) % 12
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

export const civilFromDays = (days: number): CivilDate => {
  const z = days + 719468
  const era = Math.floor(z / 146097)
  const doe = z - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1
  const month = mp < 10 ? mp + 3 : mp - 9
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day }
}

const pad = (n: number, width: number): string => String(n).padStart(width, "0")

// ---------------------------------------------------------------------------
// ServiceDate
// ---------------------------------------------------------------------------

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/

const parseCivil = (s: string): CivilDate | undefined => {
  const match = isoDatePattern.exec(s)
  if (match === null) return undefined
  const civil = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  // Round-tripping through a day number rejects dates like 2026-02-30
  const back = civilFromDays(daysFromCivil(civil))
  return back.year === civil.year && back.month === civil.month && back.day === civil.day ? civil : undefined
}

export const ServiceDate = Schema.String.check(
  Schema.makeFilter((s: string) => parseCivil(s) !== undefined, {
    expected: "a calendar date in the form YYYY-MM-DD"
  })
).pipe(Schema.brand("ServiceDate")).annotate({
  identifier: "ServiceDate",
  description: "A service day in the agency's local calendar, in the form YYYY-MM-DD"
})
export type ServiceDate = typeof ServiceDate.Type

const formatCivil = (civil: CivilDate): ServiceDate =>
  `${pad(civil.year, 4)}-${pad(civil.month, 2)}-${pad(civil.day, 2)}` as ServiceDate

/** A service date from its day number */
export const serviceDateFromDays = (days: number): ServiceDate => formatCivil(civilFromDays(days))

/** Day number of a service date. Total: every ServiceDate is a valid calendar date. */
export const serviceDateDays = (date: ServiceDate): number => daysFromCivil(parseCivil(date) as CivilDate)

export const addDays = (date: ServiceDate, days: number): ServiceDate =>
  serviceDateFromDays(serviceDateDays(date) + days)

/** 0 = Sunday ... 6 = Saturday */
export const dayOfWeek = (date: ServiceDate): number => {
  // 1970-01-01 was a Thursday (4)
  const n = (serviceDateDays(date) + 4) % 7
  return n < 0 ? n + 7 : n
}

/** GTFS calendar files write dates as YYYYMMDD */
export const ServiceDateFromGtfs = Schema.String.pipe(
  Schema.decodeTo(
    ServiceDate,
    SchemaTransformation.transform({
      decode: (s: string) => /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s,
      encode: (date: string) => date.replaceAll("-", "")
    })
  )
)

// ---------------------------------------------------------------------------
// GtfsTime
// ---------------------------------------------------------------------------

export const GtfsTime = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand("GtfsTime")
).annotate({
  identifier: "GtfsTime",
  description: "Seconds after noon minus 12 hours on the service date"
})
export type GtfsTime = typeof GtfsTime.Type

const gtfsTimePattern = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/

/** "H:MM:SS" or "HH:MM:SS", hours may be 24 or more. Unparseable input decodes to NaN and fails the Int check. */
export const GtfsTimeFromString = Schema.String.pipe(
  Schema.decodeTo(
    GtfsTime,
    SchemaTransformation.transform({
      decode: (s: string) => {
        const match = gtfsTimePattern.exec(s)
        return match === null ? Number.NaN : Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
      },
      encode: (seconds: number) =>
        `${pad(Math.floor(seconds / 3600), 2)}:${pad(Math.floor(seconds / 60) % 60, 2)}:${pad(seconds % 60, 2)}`
    })
  )
)

// ---------------------------------------------------------------------------
// Instants and the agency time zone
// ---------------------------------------------------------------------------

/** Epoch milliseconds */
export type Instant = number & { readonly Instant: unique symbol }

export const instantFromMillis = (millis: number): Instant => millis as Instant

/**
 * The instant GTFS times on `date` count from: noon minus 12 hours.
 *
 * This is midnight except on days a daylight saving change happens before
 * noon, where it is 23:00 or 01:00 local time. That is what makes 08:00:00 on
 * a DST day mean 08:00 on the clock.
 */
export const serviceDayStart = (date: ServiceDate, zone: DateTime.TimeZone): Instant => {
  const { day, month, year } = parseCivil(date) as CivilDate
  const noon = DateTime.makeZonedUnsafe(
    { year, month, day, hour: 12, minute: 0, second: 0, millisecond: 0 },
    { timeZone: zone, adjustForTimeZone: true }
  )
  return instantFromMillis(DateTime.toEpochMillis(noon) - 12 * 3600 * 1000)
}

/** When a GTFS time on a service date happens */
export const instantOf = (date: ServiceDate, time: GtfsTime, zone: DateTime.TimeZone): Instant =>
  instantFromMillis(serviceDayStart(date, zone) + time * 1000)

/** The local calendar date an instant falls on */
export const localDateOf = (instant: Instant, zone: DateTime.TimeZone): ServiceDate => {
  const parts = DateTime.toParts(DateTime.makeZonedUnsafe(instant, { timeZone: zone }))
  return formatCivil({ year: parts.year, month: parts.month, day: parts.day })
}

/** ISO 8601 with the zone's UTC offset and whole seconds, e.g. 2026-11-27T17:42:00-06:00 */
export const formatInstant = (instant: Instant, zone: DateTime.TimeZone): string => {
  const iso = DateTime.formatIsoOffset(DateTime.makeZonedUnsafe(instant, { timeZone: zone }))
  return iso.replace(/\.\d{3}(?=[+-Z])/, "")
}
