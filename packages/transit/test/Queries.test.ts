import { assert, describe, it } from "@effect/vitest"
import { Result } from "effect"
import * as Q from "../src/Queries.ts"
import { at, date, feed, iso, route, stop, trip } from "./support/fixture.ts"

const window = (d: string, from: string, to: string) => ({ from: at(d, from), to: at(d, to) })
const summary = (events: ReadonlyArray<Q.StopEvent>) =>
  events.map((e) => `${e.trip.id}@${iso(e.at)} (${e.serviceDate})`)

describe("departures", () => {
  it("finds evening departures on the right service day (old API compared dates in UTC after 6 PM)", () => {
    const events = Q.departures(feed, stop("A"), { window: window("2026-11-27", "18:00", "23:59"), limit: 20 })
    assert.deepStrictEqual(summary(events), [
      "T1@2026-11-27T18:30:00-06:00 (2026-11-27)",
      "T2@2026-11-27T23:50:00-06:00 (2026-11-27)"
    ])
  })

  it("includes the previous day's trains after midnight (times past 24:00)", () => {
    const events = Q.departures(feed, stop("B"), {
      window: { from: at("2026-11-28", "00:00"), to: at("2026-11-28", "01:00") },
      limit: 20
    })
    // Saturday 00:05, but it is Friday's service
    assert.deepStrictEqual(summary(events), ["T2@2026-11-28T00:05:00-06:00 (2026-11-27)"])
  })

  it("honors calendar exceptions: Thanksgiving runs Saturday service", () => {
    const events = Q.departures(feed, stop("D"), { window: window("2026-11-26", "00:00", "23:59"), limit: 20 })
    assert.deepStrictEqual(summary(events), ["T4@2026-11-26T09:00:00-06:00 (2026-11-26)"])
    const weekday = Q.departures(feed, stop("A"), { window: window("2026-11-26", "00:00", "23:59"), limit: 20 })
    assert.deepStrictEqual(weekday.map((e) => e.trip.id), ["T7"])
  })

  it("runs services defined only in calendar_dates.txt", () => {
    const events = Q.departures(feed, stop("A"), { window: window("2026-12-25", "11:00", "13:00"), limit: 20 })
    assert.deepStrictEqual(events.map((e) => e.trip.id), ["T6"])
  })

  it("uses pickup_type and the last stop, not the headsign, to decide what is a departure", () => {
    const day = window("2026-11-27", "00:00", "23:59")
    // B is drop-off only on T3
    assert.notInclude(Q.departures(feed, stop("B"), { window: day, limit: 20 }).map((e) => e.trip.id), trip("T3"))
    // C allows pickup on T3
    assert.include(Q.departures(feed, stop("C"), { window: day, limit: 20 }).map((e) => e.trip.id), trip("T3"))
    // D is the last stop of every weekday trip
    assert.deepStrictEqual(Q.departures(feed, stop("D"), { window: day, limit: 20 }), [])
  })

  it("lists each visit of a loop trip", () => {
    const events = Q.departures(feed, stop("A"), { window: window("2026-11-27", "09:59", "10:59"), limit: 20 })
    assert.deepStrictEqual(summary(events), [
      "T5@2026-11-27T10:00:00-06:00 (2026-11-27)",
      "T5@2026-11-27T10:20:00-06:00 (2026-11-27)"
    ])
  })

  it("filters by route, applies the limit, and treats the window as half-open", () => {
    const day = window("2026-11-27", "00:00", "23:59")
    assert.deepStrictEqual(
      Q.departures(feed, stop("A"), { window: day, routeId: route("R2"), limit: 20 }).map((e) => e.trip.id),
      ["T5", "T5"]
    )
    assert.strictEqual(Q.departures(feed, stop("A"), { window: day, limit: 2 }).length, 2)
    const exact = { from: at("2026-11-27", "18:30"), to: at("2026-11-27", "18:31") }
    assert.deepStrictEqual(Q.departures(feed, stop("A"), { window: exact, limit: 20 }).map((e) => e.trip.id), ["T1"])
    const before = { from: at("2026-11-27", "18:29"), to: at("2026-11-27", "18:30") }
    assert.deepStrictEqual(Q.departures(feed, stop("A"), { window: before, limit: 20 }), [])
  })

  it("keeps wall-clock times on daylight saving change days", () => {
    const spring = Q.departures(feed, stop("A"), { window: window("2026-03-08", "07:00", "09:00"), limit: 20 })
    assert.deepStrictEqual(summary(spring), ["T7@2026-03-08T08:00:00-05:00 (2026-03-08)"])
    const fall = Q.departures(feed, stop("A"), { window: window("2026-11-01", "07:00", "09:00"), limit: 20 })
    assert.deepStrictEqual(summary(fall), ["T7@2026-11-01T08:00:00-06:00 (2026-11-01)"])
  })
})

describe("arrivals", () => {
  it("excludes the first stop and drop-off restrictions", () => {
    const day = window("2026-11-27", "00:00", "23:59")
    assert.deepStrictEqual(Q.arrivals(feed, stop("A"), { window: day, limit: 20 }).map((e) => e.trip.id), ["T5"])
    // C is pickup only on T3
    assert.notInclude(Q.arrivals(feed, stop("C"), { window: day, limit: 20 }).map((e) => e.trip.id), trip("T3"))
  })

  it("uses the arrival time, not the departure time", () => {
    const events = Q.arrivals(feed, stop("B"), { window: window("2026-11-27", "18:00", "19:00"), limit: 20 })
    assert.deepStrictEqual(summary(events), ["T1@2026-11-27T18:40:00-06:00 (2026-11-27)"])
  })
})

describe("directTrips", () => {
  it("finds trains serving both stops in order, with arrival times", () => {
    const trips = Q.directTrips(feed, stop("A"), stop("D"), { window: window("2026-11-27", "00:00", "23:59"), limit: 20 })
    assert.deepStrictEqual(
      trips.map((t) => `${t.trip.id} ${iso(t.departAt)} -> ${iso(t.arriveAt)}`),
      [
        "T3 2026-11-27T07:00:00-06:00 -> 2026-11-27T07:30:00-06:00",
        "T1 2026-11-27T18:30:00-06:00 -> 2026-11-27T19:00:00-06:00",
        "T2 2026-11-27T23:50:00-06:00 -> 2026-11-28T00:40:00-06:00"
      ]
    )
  })

  it("never goes backwards and respects boarding restrictions", () => {
    const day = window("2026-11-27", "00:00", "23:59")
    assert.deepStrictEqual(Q.directTrips(feed, stop("D"), stop("A"), { window: day, limit: 20 }), [])
    // T3 can't be boarded at B
    assert.notInclude(
      Q.directTrips(feed, stop("B"), stop("D"), { window: day, limit: 20 }).map((t) => t.trip.id),
      trip("T3")
    )
  })
})

describe("tripInstance", () => {
  it("resolves every call on the service date, past midnight included", () => {
    const instance = Result.getOrThrow(Q.tripInstance(feed, trip("T2"), date("2026-11-27")))
    assert.deepStrictEqual(instance.calls.map((c) => iso(c.arriveAt)), [
      "2026-11-27T23:50:00-06:00",
      "2026-11-28T00:05:00-06:00",
      "2026-11-28T00:20:00-06:00",
      "2026-11-28T00:40:00-06:00"
    ])
  })

  it("distinguishes an unknown trip from one that doesn't run that day", () => {
    const notRunning = Q.tripInstance(feed, trip("T1"), date("2026-11-28"))
    assert.isTrue(Result.isFailure(notRunning) && notRunning.failure._tag === "TripNotRunning")
    const unknown = Q.tripInstance(feed, trip("NOPE"), date("2026-11-27"))
    assert.isTrue(Result.isFailure(unknown) && unknown.failure._tag === "TripNotFound")
  })
})

describe("reachableStops", () => {
  it("lists stops downstream when the stop is the origin, upstream when it is the destination", () => {
    const friday = date("2026-11-27")
    assert.deepStrictEqual([...Q.reachableStops(feed, stop("B"), "origin", friday)].sort(), ["A", "C", "D"])
    assert.deepStrictEqual([...Q.reachableStops(feed, stop("B"), "destination", friday)].sort(), ["A"])
    // Saturday: only T4 (D -> A) and T7 (A -> B)
    assert.deepStrictEqual([...Q.reachableStops(feed, stop("B"), "origin", date("2026-11-28"))].sort(), ["A"])
  })
})

describe("searchStops", () => {
  const names = (q: string) => Q.searchStops(feed, q).map((s) => s.name)

  it("ranks exact, prefix, word-prefix, then substring matches", () => {
    assert.deepStrictEqual(names("chicago"), ["Chicago Union Station"])
    assert.deepStrictEqual(names("union"), ["Chicago Union Station"])
    assert.deepStrictEqual(names("a"), ["Aurora", "Western Ave", "Chicago Union Station", "Naperville"])
  })

  it("ignores case, punctuation and accents, and matches ids", () => {
    assert.deepStrictEqual(names("  WESTERN-ave "), ["Western Ave"])
    assert.deepStrictEqual(names("Nâperville"), ["Naperville"])
    assert.deepStrictEqual(names("d"), ["Chicago Union Station"])
    assert.deepStrictEqual(names("!!"), [])
  })
})

describe("routePatterns", () => {
  it("groups trips by direction and stop sequence", () => {
    const patterns = Q.routePatterns(feed, route("R1"))
    assert.deepStrictEqual(patterns[0], {
      directionId: 1,
      stopIds: [stop("A"), stop("B"), stop("C"), stop("D")],
      headsign: "Chicago Union Station",
      tripCount: 3
    })
  })
})
