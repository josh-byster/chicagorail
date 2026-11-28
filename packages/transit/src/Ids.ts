/**
 * Identifiers from the GTFS feed.
 *
 * Each is a non-empty string with its own brand, so a stop id can never be
 * passed where a trip id is expected.
 */
import { Schema } from "effect"

const Identifier = Schema.String.check(Schema.isNonEmpty(), Schema.isTrimmed())

export const StopId = Identifier.pipe(Schema.brand("StopId")).annotate({
  identifier: "StopId",
  description: "A stop (station) identifier from the GTFS feed, for example `NAPERVILLE`"
})
export type StopId = typeof StopId.Type

export const TripId = Identifier.pipe(Schema.brand("TripId")).annotate({
  identifier: "TripId",
  description: "A trip identifier from the GTFS feed"
})
export type TripId = typeof TripId.Type

export const RouteId = Identifier.pipe(Schema.brand("RouteId")).annotate({
  identifier: "RouteId",
  description: "A route (line) identifier from the GTFS feed, for example `BNSF`"
})
export type RouteId = typeof RouteId.Type

export const ServiceId = Identifier.pipe(Schema.brand("ServiceId")).annotate({
  identifier: "ServiceId"
})
export type ServiceId = typeof ServiceId.Type
