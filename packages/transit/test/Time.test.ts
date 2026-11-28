import { assert, describe, it } from "@effect/vitest"
import { DateTime, Effect, Exit, Schema } from "effect"
import * as Time from "../src/Time.ts"

const chicago = DateTime.zoneMakeNamedUnsafe("America/Chicago")
const date = (s: string) => Schema.decodeSync(Time.ServiceDate)(s)
const time = (s: string) => Schema.decodeSync(Time.GtfsTimeFromString)(s)

describe("ServiceDate", () => {
  it("accepts real dates and rejects impossible ones", () => {
    assert.strictEqual(date("2026-11-27"), "2026-11-27")
    assert.isTrue(Exit.isFailure(Schema.decodeExit(Time.ServiceDate)("2026-02-30")))
    assert.isTrue(Exit.isFailure(Schema.decodeExit(Time.ServiceDate)("2026-1-5")))
    assert.isTrue(Exit.isFailure(Schema.decodeExit(Time.ServiceDate)("20261127")))
  })

  it("decodes GTFS YYYYMMDD dates", () => {
    assert.strictEqual(Schema.decodeSync(Time.ServiceDateFromGtfs)("20240229"), "2024-02-29")
    assert.isTrue(Exit.isFailure(Schema.decodeExit(Time.ServiceDateFromGtfs)("20230229")))
  })

  it("computes weekdays and adds days across months and years", () => {
    assert.strictEqual(Time.dayOfWeek(date("2026-11-27")), 5) // Friday
    assert.strictEqual(Time.dayOfWeek(date("1970-01-01")), 4) // Thursday
    assert.strictEqual(Time.dayOfWeek(date("1969-12-28")), 0) // Sunday
    assert.strictEqual(Time.addDays(date("2026-12-31"), 1), "2027-01-01")
    assert.strictEqual(Time.addDays(date("2024-03-01"), -1), "2024-02-29")
  })

  it.effect.prop("day numbers round-trip", [Schema.Int.check(Schema.isBetween({ minimum: -200_000, maximum: 200_000 }))], ([n]) =>
    Effect.sync(() => {
      assert.strictEqual(Time.serviceDateDays(Time.serviceDateFromDays(n)), n)
      assert.strictEqual(Time.serviceDateDays(Time.addDays(Time.serviceDateFromDays(n), 1)), n + 1)
    }))
})

describe("GtfsTime", () => {
  it("parses times past midnight and single-digit hours", () => {
    assert.strictEqual(time("04:00:01"), 4 * 3600 + 1)
    assert.strictEqual(time("4:00:01"), 4 * 3600 + 1)
    assert.strictEqual(time("25:10:00"), 25 * 3600 + 600)
  })

  it("rejects malformed times", () => {
    for (const bad of ["", "12:60:00", "12:00", "aa:bb:cc", "-1:00:00"]) {
      assert.isTrue(Exit.isFailure(Schema.decodeExit(Time.GtfsTimeFromString)(bad)), bad)
    }
  })
})

describe("instants in America/Chicago", () => {
  const at = (d: string, t: string) => Time.formatInstant(Time.instantOf(date(d), time(t), chicago), chicago)

  it("resolves an ordinary day", () => {
    assert.strictEqual(at("2026-11-27", "17:42:00"), "2026-11-27T17:42:00-06:00")
  })

  it("resolves times past 24:00 onto the next calendar day", () => {
    assert.strictEqual(at("2026-11-27", "24:40:00"), "2026-11-28T00:40:00-06:00")
  })

  it("keeps wall-clock times correct on the spring-forward day", () => {
    // 2026-03-08: clocks jump from 02:00 CST to 03:00 CDT
    assert.strictEqual(at("2026-03-08", "08:00:00"), "2026-03-08T08:00:00-05:00")
    assert.strictEqual(at("2026-03-08", "23:30:00"), "2026-03-08T23:30:00-05:00")
  })

  it("keeps wall-clock times correct on the fall-back day", () => {
    // 2026-11-01: clocks fall back from 02:00 CDT to 01:00 CST
    assert.strictEqual(at("2026-11-01", "08:00:00"), "2026-11-01T08:00:00-06:00")
    assert.strictEqual(at("2026-11-01", "22:15:00"), "2026-11-01T22:15:00-06:00")
  })

  it("finds the local date of an instant, including late evening", () => {
    // 23:30 Chicago is 05:30 UTC the next day: the local date must not roll over
    const lateEvening = Time.instantOf(date("2026-11-27"), time("23:30:00"), chicago)
    assert.strictEqual(Time.localDateOf(lateEvening, chicago), "2026-11-27")
  })
})
