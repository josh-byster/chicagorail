# Plan: chicagorail API v1 (Effect) + MCP server

## Context
Rebuild the chicagorail backend as a strong public REST API whose main goal is correctness, written in functional Effect TypeScript. Then put an MCP server on top that calls the API, so Claude and ChatGPT users can ask about Metra trains.

The user's decisions:
- **Effect** (v4, currently 4.1.7)
- **Replace `/api` outright.** The website and iOS app move to the new API in the same effort.
- **Metra only for now**, with a data model that leaves room for CTA later.
- Follow Effect's LLM guidance:
  - vendor the Effect source with `git subtree`
  - use the `@effect/tsgo` language service (LSP)
  - keep the feedback loop tight, as in mikearnaldi/accountability

### Problems in today's backend
Today's backend (`packages/backend`, about 1,600 lines of Express plus classes) has real correctness bugs, verified by reading `origin/main`:
- **`isServiceActiveOnDate` mixes UTC and local time.** It takes the date from UTC (`toISOString`) and the weekday from local time (`getDay`). After 6 PM Chicago time, it checks one day's weekday against the next day's calendar date. (`services/gtfsService.ts:330`)
- **Service from the previous day is ignored.** At 12:30 AM, trains with times like `24:40:00` are never returned.
- **GTFS times are resolved by `setHours` on a JS Date.** GTFS defines times relative to noon minus 12h, so this is wrong on DST change days.
- **`GET /trips/:id?date=` parses the date as UTC midnight,** which is the previous evening in Chicago. (`routes/trips.ts:70`)
- **The CSV parser splits on every comma,** so a quoted field containing a comma corrupts its row. (`gtfsService.ts:275`)
- **Departures and arrivals are told apart by guessing from the headsign text.** `pickup_type` and `drop_off_type` are ignored, as are the first and last stops.
- **Canceled trains look on time.** The trip is silently dropped from realtime, so it shows only its scheduled time.
- **Request handling is loose:**
  - an unknown stop returns a 500 instead of a 404
  - `limit=abc` returns an empty list
  - nothing is cacheable
  - errors have an inconsistent shape
- **Performance:**
  - `findDirectTrips` rescans every stop time for every trip
  - `getStopConnections` rebuilds its index on every request
  - each refresh sets `data = null`, so requests block until the reload finishes

### Clients
- **Website** (`packages/frontend`): 23 files use the API through `src/lib/api.ts` and the `@chicagorail/shared` types.
- **iOS app:** `packages/ios/.../Services/APIService.swift`, plus 6 Codable model files. It is not on the public App Store (checked via the iTunes search API), so cutting over can't break public installs. TestFlight builds would need an update.

## Architecture
The OpenAPI spec becomes the source of truth between server and clients, replacing `@chicagorail/shared`. This mirrors the accountability repo: Effect on the server, generated types on the clients.

```
packages/
  transit/    pure domain: no IO, no Date, no throw. Schema-typed GTFS model and queries
  api/        Effect HttpApi definition + handlers + feed services → OpenAPI, Scalar docs
  mcp/        Effect McpServer (effect/ai) tools that call the API via HttpApiClient
  frontend/   React, no Effect; openapi-typescript types + openapi-fetch client
  ios/        Codable models updated to the v1 shapes
repos/effect  vendored Effect source (git subtree --squash), read-only reference
```
`packages/backend` and `packages/shared` are deleted at cutover.

### `packages/transit`: correctness core, pure functions
- **Branded IDs:** `StopId`, `TripId`, `RouteId`.
- **Explicit time types:**
  - `ServiceDate`, a Chicago calendar date
  - `GtfsTime`, seconds since "noon minus 12h", which allows ≥24h values
  - `Instant`, an Effect `DateTime`
- `resolve(serviceDate, gtfsTime) → DateTime.Zoned` in America/Chicago. This is correct across DST changes.
- **An RFC 4180 CSV parser,** and Schema decoding of every GTFS file. A row that fails to decode is a typed error with file and line, never a silent `NaN`.
- **`Feed`, an immutable indexed snapshot built once per download:**
  - stop times by trip, sorted by sequence
  - stop times by stop
  - routes by stop
  - service calendar resolution, covering calendar.txt plus calendar_dates.txt
  - a feed version hash and valid date range
- **Queries:**
  - `departures(feed, stop, window)` and `arrivals(...)`. These check every service day that overlaps the window, including the day before for times past 24:00. Eligibility comes from `pickup_type` and `drop_off_type`, the first and last stop, and `stop_sequence`, which also handles trips that visit the same stop twice.
  - `directTrips(feed, origin, destination, window)`
  - `tripInstance(feed, tripId, serviceDate)`
  - `reachableStops(feed, stop, direction, serviceDate)`
- **Realtime merge as pure functions,** ported from `services/realtimeEnrichment.ts`, whose GTFS-rt delay propagation is already sound and pure:
  - match on `stop_sequence` wherever it's known
  - represent cancellations explicitly
  - reuse the parsing in `realtimeService.ts:parseTripUpdates`/`parseVehiclePositions`, including the `presentNumber` own-property check

### `packages/api`: Effect HttpApi
- **Services as Layers:**
  - **`ScheduleFeed`:** downloads from `schedules.metrarail.com` with a timeout and retries on a Schedule. It validates the new feed (decodes, references resolve, sanity counts) and swaps it in atomically through a `SubscriptionRef`. It keeps serving the last good feed if a refresh fails, and refreshes hourly. On startup it uses the committed `schedule/` files until the download finishes, so the healthcheck passes quickly.
  - **`RealtimeFeed`:** a 30s cached snapshot with backoff (15 min after an auth failure). Credentials come from `Config.redacted("GTFS_TOKEN")`.
  - **`Clock`:** "now" comes only from Effect's Clock, so `TestClock` drives the tests.
- **Endpoints** (`snake_case` to match GTFS):

  | Endpoint | Returns |
  |---|---|
  | `GET /v1/routes`, `/v1/routes/{route_id}` | a route, with its stops in line order |
  | `GET /v1/stops?q=&near=lat,lon&route_id=` | list or search |
  | `GET /v1/stops/{stop_id}` | one stop |
  | `GET /v1/stops/{stop_id}/departures?after=&before=&route_id=&limit=` | departures |
  | `GET /v1/stops/{stop_id}/arrivals?…` | the same shape |
  | `GET /v1/stops/{stop_id}/reachable?direction=outbound\|inbound&service_date=` | replaces `/connections` |
  | `GET /v1/trips?origin=&destination=&after=&limit=` | direct trips |
  | `GET /v1/trips/{trip_id}/{service_date}` | a trip instance with every stop and vehicle position |
  | `GET /v1/feed` | feed version, valid range, last refresh, realtime status |
  | `GET /health` | health check |
  | `GET /v1/openapi.json`, `/docs` | OpenAPI spec and Scalar docs |
- **Conventions:**
  - Every time is ISO 8601 with its Chicago offset, plus an explicit `service_date`.
  - Every stop event is `{scheduled, realtime: {state: scheduled|on_time|late|early|canceled, delay_seconds?, predicted?}}`. The `realtime` field is always present, never missing.
  - Every input is decoded by Schema. Errors are RFC 9457 `application/problem+json` with typed codes (`stop_not_found`, `invalid_parameter`, …) and the right status code.
  - `limit` defaults to 20, with a documented maximum of 100.
  - Cache headers: schedule data gets `max-age=3600` with an ETag from the feed version, and realtime data gets `max-age=15`. The CORS allow-list carries over from `src/index.ts`.

### `packages/mcp`: tools that call the API
- `McpServer.layerHttp` at `https://mcp.chicagorail.app/mcp`. It's stateless, needs no auth, and is read-only (`readOnlyHint`).
- It uses an `HttpApiClient.make(Api)` built from the same API definition, so the MCP server and the API can't drift apart.
- **Tools:**
  - `find_stations` (by name or near a location)
  - `next_departures`
  - `plan_direct_trip` (states plainly that transfers aren't covered)
  - `trip_status`
  - `list_lines`
  - `service_status`
- Tools accept a station ID or a name. An ambiguous name returns the candidates.
- Tool descriptions say Metra only and Chicago time.
- Submitting to the ChatGPT and Claude directories (privacy and terms pages) is a later follow-up, not part of this plan.

### Agent and feedback-loop setup
- `git subtree add --prefix=repos/effect https://github.com/Effect-TS/effect.git main --squash`. It's excluded from Docker builds (`.dockerignore`), tsconfig, lint, tests and editor search. The repo CLAUDE.md gets the "Vendored Repositories" section, with instructions to read `repos/effect/LLMS.md` before writing Effect code.
- `npx @effect/tsgo setup` for the backend packages, which needs TypeScript 7 there. The website can stay on its own TypeScript. Typecheck runs through `effect-tsgo tsc -b`, with Effect diagnostics as errors.
- **Lint rules** in oxlint/ESLint, scoped to `packages/transit` and `packages/api`. They ban:
  - `Date` and `Math.random` (use Clock and Random instead)
  - `process.env` (use Config instead)
  - `throw` and `try` (use typed errors instead)
  - `any`
  - mutable `let` in the core
  - classes other than Schema/Data tagged classes
- **One command:** `pnpm check` runs typecheck, lint, tests and an OpenAPI-is-up-to-date check. CI runs the same command.
- `docs/api-conventions.md` records the conventions above. The repo's CLAUDE.md is rewritten for the new layout.

## Execution (trunk-based, zero-downtime cutover)
I'll work in a separate git worktree with a detached HEAD at `origin/main` and push with `git push origin HEAD:main`. Your `~/Developer/chicagorail` clone stays untouched: its uncommitted files, its stashes, and the two landing-page commits that exist only on your machine.

1. **Scaffold:** the subtree, the tsgo LSP, lint rules, `pnpm check`, and the CLAUDE.md update. Push.
2. **`packages/transit`, built test-first:**
   - golden tests on the existing fixture (`packages/backend/__tests__/fixtures/gtfs`)
   - focused tests: after 6 PM, after midnight, the DST dates 2026-03-08 and 2026-11-01, calendar exceptions, loop trips, quoted CSV fields
   - property tests (fast-check via Schema arbitraries) for time resolution
   - port of the existing realtime tests in `__tests__/unit/realtime.test.ts`
3. **`packages/api`:**
   - handlers, the feed and realtime layers, the OpenAPI and Scalar docs
   - integration tests through `HttpApiClient` against a test Layer
   - deploy as a new Dokku app `chicagorail-api-v1` at `next-api.chicagorail.app`: cf DNS record, letsencrypt, `GTFS_TOKEN` copied from `chicagorail-api`
   - extend CI to deploy it
4. **Comparison script:** query the old production API and `next-api` at 20 stations and several times. I'll review every difference: it should either be a bug fix (explained) or match.
5. **`packages/mcp`:** a Dokku app `chicagorail-mcp` at `mcp.chicagorail.app`, built from its own Dockerfile (`builder-dockerfile:set`), deployed by CI.
6. **Website:**
   - generate types from `openapi.json` and replace `src/lib/api.ts` with openapi-fetch
   - update the hooks and components (`useDepartures`, `useTrips`, `useTripDetails`, `TripsResults`, `TrainDetail`, …) to the new shapes
   - set Vercel's `VITE_API_URL` to `https://next-api.chicagorail.app/v1` and push. The site switches over in one atomic Vercel deploy.
7. **iOS:** update the Codable models and `APIService.swift` for v1, with the default base URL `https://api.chicagorail.app/v1`. Build and test with `xcodebuild` on the simulator.
8. **Cutover:**
   - move the `api.chicagorail.app` domain to `chicagorail-api-v1`, keeping `next-api` as an alias for now
   - point Vercel back at `api.`
   - update the `DOKKU_APP_NAME` secret
   - update the Gatus check from `/api/...` to `/v1/feed`
   - rewrite `scripts/check-backend.mjs` for v1
   - delete `packages/backend`, `packages/shared` and the old Dokku app `chicagorail-api`, after you confirm

## Verification
- `pnpm check` passes locally and in CI. I'll watch every push with `gh run list --commit` and `gh run watch --exit-status`.
- The focused bug tests above each fail against the old logic and pass against the new.
- Locally:
  - run the API and curl every endpoint, including bad input (400 problem+json) and an unknown stop (404)
  - check the ETag/304 behavior
  - open `/docs`
- **The comparison script** (step 4): any difference that isn't explained blocks the cutover.
- **MCP:**
  - test with `npx @modelcontextprotocol/inspector`
  - add it with `claude mcp add --transport http chicagorail https://mcp.chicagorail.app/mcp` and ask real questions: "next train from Naperville to Union Station", plus an ambiguous station name
  - test in ChatGPT Developer Mode
- **Website:** vitest, build, and a manual pass on the production URL after each switch.
- **iOS:** simulator build and tests.
- **After cutover:** Gatus checks are green, the server's memory in Beszel looks normal, and there are no 5xx errors in `dokku logs`.
