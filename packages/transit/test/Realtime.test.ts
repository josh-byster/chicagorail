import { assert, describe, it } from "@effect/vitest"
import type { TripId } from "../src/Ids.ts"
import * as R from "../src/Realtime.ts"
import * as Time from "../src/Time.ts"
import { at, date, feed, iso, stop, trip } from "./support/fixture.ts"

const T1 = feed.tripsById.get(trip("T1"))!
const T5 = feed.tripsById.get(trip("T5"))!
const friday = date("2026-11-27")

const snapshot = (updates: ReadonlyArray<R.TripUpdate>, fetchedAt = at("2026-11-27", "18:35")): R.Snapshot => {
  const tripUpdates = new Map<TripId, Array<R.TripUpdate>>()
  for (const u of updates) tripUpdates.set(u.tripId, [...(tripUpdates.get(u.tripId) ?? []), u])
  return { fetchedAt, tripUpdates, vehicles: new Map() }
}

const update = (u: Partial<R.TripUpdate>): R.TripUpdate => ({
  tripId: trip("T1"),
  startDate: friday,
  canceled: false,
  stopTimeUpdates: [],
  ...u
})

const describePrediction = (p: R.Prediction) =>
  "predictedAt" in p ? `${p.state} ${p.delaySeconds}s ${iso(p.predictedAt)}` : p.state

describe("predict", () => {
  it("applies a stop's delay to its scheduled time", () => {
    const s = snapshot([update({ stopTimeUpdates: [{ stopSequence: 2, departure: { delay: 240 }, relationship: "scheduled" }] })])
    assert.strictEqual(describePrediction(R.predict(feed, s, T1, friday, 1, "departure")), "late 240s 2026-11-27T18:45:00-06:00")
  })

  it("prefers an absolute predicted time", () => {
    const predicted = at("2026-11-27", "18:44") / 1000
    const s = snapshot([update({ stopTimeUpdates: [{ stopSequence: 2, departure: { time: predicted }, relationship: "scheduled" }] })])
    assert.strictEqual(describePrediction(R.predict(feed, s, T1, friday, 1, "departure")), "late 180s 2026-11-27T18:44:00-06:00")
  })

  it("uses the arrival for arrivals and falls back to the other event", () => {
    const s = snapshot([update({
      stopTimeUpdates: [{ stopSequence: 2, arrival: { delay: 60 }, departure: { delay: 120 }, relationship: "scheduled" }]
    })])
    assert.strictEqual(describePrediction(R.predict(feed, s, T1, friday, 1, "arrival")), "late 60s 2026-11-27T18:41:00-06:00")
    const onlyArrival = snapshot([update({ stopTimeUpdates: [{ stopSequence: 2, arrival: { delay: 60 }, relationship: "scheduled" }] })])
    assert.strictEqual(describePrediction(R.predict(feed, onlyArrival, T1, friday, 1, "departure")), "late 60s 2026-11-27T18:42:00-06:00")
  })

  it("counts under a minute as on time and negative delays as early", () => {
    const of = (delay: number) =>
      R.predict(feed, snapshot([update({ delay })]), T1, friday, 0, "departure").state
    assert.strictEqual(of(59), "on_time")
    assert.strictEqual(of(-59), "on_time")
    assert.strictEqual(of(60), "late")
    assert.strictEqual(of(-60), "early")
  })

  it("carries the closest earlier stop's delay forward to stops without an update", () => {
    const s = snapshot([update({
      stopTimeUpdates: [
        { stopSequence: 1, departure: { delay: 60 }, relationship: "scheduled" },
        { stopSequence: 2, departure: { delay: 300 }, relationship: "scheduled" }
      ]
    })])
    assert.strictEqual(describePrediction(R.predict(feed, s, T1, friday, 3, "arrival")), "late 300s 2026-11-27T19:05:00-06:00")
  })

  it("falls back to the trip-level delay, and stays scheduled with no data", () => {
    assert.strictEqual(R.predict(feed, snapshot([update({ delay: 120 })]), T1, friday, 2, "arrival").state, "late")
    assert.strictEqual(R.predict(feed, snapshot([update({})]), T1, friday, 2, "arrival").state, "scheduled")
    const noData = snapshot([update({
      delay: 120,
      stopTimeUpdates: [{ stopSequence: 2, relationship: "no_data" }]
    })])
    assert.strictEqual(R.predict(feed, noData, T1, friday, 3, "arrival").state, "scheduled")
  })

  it("reports canceled trips and skipped stops instead of dropping them", () => {
    assert.strictEqual(R.predict(feed, snapshot([update({ canceled: true })]), T1, friday, 1, "departure").state, "canceled")
    const skipped = snapshot([update({ stopTimeUpdates: [{ stopSequence: 3, relationship: "skipped" }] })])
    assert.strictEqual(R.predict(feed, skipped, T1, friday, 2, "arrival").state, "skipped")
  })

  it("applies an update only to the trip instance on its start date", () => {
    const s = snapshot([update({ startDate: date("2026-11-30"), delay: 300 })])
    assert.strictEqual(R.predict(feed, s, T1, friday, 1, "departure").state, "scheduled")
  })

  it("applies undated updates only to the instance running around the feed time", () => {
    const s = snapshot([update({ startDate: undefined, delay: 300 })], at("2026-11-27", "18:35"))
    assert.strictEqual(R.predict(feed, s, T1, friday, 1, "departure").state, "late")
    assert.strictEqual(R.predict(feed, s, T1, date("2026-11-30"), 1, "departure").state, "scheduled")
  })

  it("matches loop trips by stop_sequence, never by a repeated stop_id", () => {
    const s = snapshot([update({
      tripId: trip("T5"),
      stopTimeUpdates: [{ stopId: stop("A"), departure: { delay: 600 }, relationship: "scheduled" }]
    })], at("2026-11-27", "10:05"))
    // A appears twice in T5, so a stop_id-only update can't be placed
    assert.strictEqual(R.predict(feed, s, T5, friday, 0, "departure").state, "scheduled")
    const bySequence = snapshot([update({
      tripId: trip("T5"),
      stopTimeUpdates: [{ stopSequence: 3, departure: { delay: 600 }, relationship: "scheduled" }]
    })], at("2026-11-27", "10:05"))
    assert.strictEqual(R.predict(feed, bySequence, T5, friday, 0, "departure").state, "scheduled")
    assert.strictEqual(describePrediction(R.predict(feed, bySequence, T5, friday, 2, "departure")), "late 600s 2026-11-27T10:30:00-06:00")
  })

  it("returns scheduled when the snapshot has nothing for the trip", () => {
    assert.strictEqual(R.predict(feed, R.emptySnapshot(Time.instantFromMillis(0)), T1, friday, 1, "departure").state, "scheduled")
  })
})
