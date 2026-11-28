import { assert, describe, it } from "@effect/vitest"
import { Result } from "effect"
import * as Feed from "../src/Feed.ts"
import * as Gtfs from "../src/Gtfs.ts"
import * as Q from "../src/Queries.ts"
import * as Time from "../src/Time.ts"
import { build, files } from "./support/fixture.ts"
import { loadFiles } from "./support/loadFiles.ts"

const failure = (overrides: Partial<Record<string, string>>) => {
  const result = build(overrides)
  assert.isTrue(Result.isFailure(result), "expected the feed to be rejected")
  return Result.isFailure(result) ? result.failure.message : ""
}

const stopTimes = (extra: string) => `${files["stop_times.txt"]}\n${extra}`

describe("Feed.build rejects inconsistent feeds", () => {
  it("unknown stop, trip, route or service references", () => {
    assert.include(failure({ "stop_times.txt": stopTimes("T1,19:10:00,19:10:00,ZZZ,5,0,0") }), "unknown stop")
    assert.include(failure({ "stop_times.txt": stopTimes("TX,19:10:00,19:10:00,A,1,0,0") }), "unknown trip")
    assert.include(failure({ "trips.txt": `${files["trips.txt"]}\nR9,WK,T9,X,1` }), "unknown route")
    assert.include(failure({ "trips.txt": `${files["trips.txt"]}\nR1,NOPE,T9,X,1` }), "unknown service")
  })

  it("trips that repeat a sequence, go back in time, or have one stop", () => {
    assert.include(failure({ "stop_times.txt": stopTimes("T1,19:10:00,19:10:00,A,4,0,0") }), "repeats stop_sequence")
    assert.include(failure({ "stop_times.txt": stopTimes("T1,18:00:00,18:00:00,A,5,0,0") }), "back in time")
    assert.include(failure({ "stop_times.txt": stopTimes("T1,19:10:00,19:00:00,A,5,0,0") }), "before arriving")
    assert.include(failure({ "trips.txt": `${files["trips.txt"]}\nR1,WK,T9,X,1` }), "fewer than two")
  })

  it("a bad time zone, duplicate ids, or contradictory exceptions", () => {
    assert.include(failure({ "agency.txt": "agency_name,agency_timezone\nX,Mars/Olympus" }), "Unknown agency time zone")
    assert.include(failure({ "stops.txt": `${files["stops.txt"]}\nA,Again,41,-88,0` }), "Duplicate stop")
    assert.include(
      failure({ "calendar_dates.txt": `${files["calendar_dates.txt"]}\nWK,20261126,1` }),
      "both added and removed"
    )
  })

  it("malformed values, with the file and line", () => {
    const result = Gtfs.decodeTables({ ...files, "stops.txt": "stop_id,stop_name,stop_lat,stop_lon\nA,Aurora,north,-88" })
    assert.isTrue(Result.isFailure(result))
    if (Result.isFailure(result)) {
      assert.strictEqual(result.failure.file, "stops.txt")
      assert.strictEqual(result.failure.line, 2)
    }
  })
})

describe("Feed.isServiceActive", () => {
  it("applies the weekly pattern inside the date range, then exceptions", () => {
    const feed = Result.getOrThrow(build())
    const wk = feed.servicesById.get("WK" as never) as Feed.Service
    const d = (s: string) => s as Time.ServiceDate
    assert.isTrue(Feed.isServiceActive(wk, d("2026-11-27")))
    assert.isFalse(Feed.isServiceActive(wk, d("2026-11-28")))
    assert.isFalse(Feed.isServiceActive(wk, d("2026-11-26")))
    assert.isFalse(Feed.isServiceActive(wk, d("2027-01-04")))
    assert.deepStrictEqual(feed.validity, { start: "2026-01-01", end: "2026-12-31" })
  })
})

describe("the real Metra feed in schedule/", () => {
  const tables = Gtfs.decodeTables(loadFiles(new URL("../../../schedule", import.meta.url).pathname))
  const feed = Result.getOrThrow(Result.flatMap(tables, (t) => Feed.build("schedule", t)))

  it("passes every integrity check", () => {
    assert.strictEqual(feed.timeZoneId, "America/Chicago")
    assert.isAbove(feed.tripsById.size, 1000)
    assert.isAbove(feed.stops.length, 200)
  })

  it("answers a weekday departure board in time order", () => {
    const day = feed.validity.start
    const window = {
      from: Time.instantOf(day, 0 as Time.GtfsTime, feed.timeZone),
      to: Time.instantOf(Time.addDays(day, 1), 0 as Time.GtfsTime, feed.timeZone)
    }
    const busiest = [...feed.visitsByStop.entries()].sort((a, b) => b[1].length - a[1].length)[0]
    assert.isDefined(busiest)
    if (busiest === undefined) return
    const events = Q.departures(feed, busiest[0], { window, limit: 1000 })
    assert.isAbove(events.length, 10)
    events.forEach((e, i) => {
      assert.isTrue(e.at >= window.from && e.at < window.to)
      if (i > 0) assert.isTrue(e.at >= (events[i - 1] as Q.StopEvent).at)
    })
  })
})
