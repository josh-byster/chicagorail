# CLAUDE.md

Guidance for Claude Code in this repository.

## Project

Chicago Rail tracks Metra trains: a public REST API (`api.chicagorail.app`), an MCP server for AI assistants (`mcp.chicagorail.app`), a React website (Vercel) and an iOS app. pnpm workspace, Node 22.

**Migration in progress** (see `docs/api-v1-plan.md`): `packages/backend` + `packages/shared` (Express, `/api`) are being replaced by `packages/transit` + `packages/api` (Effect, `/v1`) and `packages/mcp`. Until cutover, production still runs `packages/backend`; don't add features there.

## Packages

| Package | What it is | Style |
|---|---|---|
| `packages/transit` | Pure GTFS domain: CSV parsing, row Schemas, the indexed `Feed`, schedule queries, realtime merge | Effect, pure functions, no IO |
| `packages/api` | Effect `HttpApi` server: endpoints, feed download/refresh, GTFS-realtime | Effect |
| `packages/mcp` | Effect `McpServer` whose tools call the API through a typed `HttpApiClient` | Effect |
| `packages/frontend` | React + Vite SPA; types generated from the API's OpenAPI spec | No Effect |
| `packages/ios` | SwiftUI app | Swift |

The API definition (`packages/api/src/Api.ts`) is the contract. Clients use the generated OpenAPI types; never hand-write response types.

## Commands

```bash
pnpm install
pnpm check          # lint + typecheck + tests for the Effect packages; run before every commit
pnpm --filter ./packages/transit test:watch
```

## Correctness rules (the reason this rewrite exists)

- Time: `ServiceDate` (agency-local calendar day), `GtfsTime` (seconds after noon minus 12h, may exceed 24h) and `Instant` (epoch ms) are different types. Convert only with `Time.instantOf` / `Time.localDateOf`, which use the feed's `agency_timezone`. Never use `Date`, `toISOString().slice(0, 10)` or `getDay()`.
- A query over a time window must consider every service date that can reach into it (`Queries.serviceDatesFor`), including the previous day for times past 24:00.
- Departures/arrivals come from `pickup_type`/`drop_off_type` and first/last stop (`Queries.canBoard`/`canAlight`), never from headsign text.
- Match realtime updates by `stop_sequence` (stop_id only when the trip visits the stop once) and by trip `start_date`.
- Untrusted input (CSV rows, query params, protobuf) is decoded with `Schema` at the edge. A bad feed is rejected whole; the API keeps serving the last good one.
- Every bug fix gets a test in the synthetic fixture (`packages/transit/test/support/fixture.ts`) that fails without the fix.

## Effect code

Lint (`eslint.effect.config.mjs`) bans `Date`, `Math.random`, `process`, `throw`/`try`, `console`, `fetch`, `setTimeout`, non-Schema classes, enums and module-level `let` in the Effect packages. Use `DateTime`/`Clock`, `Random`, `Config`, typed errors (`Schema.TaggedError`, `Result`, `Effect.fail`), `Effect.log`, `HttpClient` and `Schedule`. The Effect language service runs inside `effect-tsgo tsc`; its warnings fail the typecheck.

## Vendored Repositories

This project vendors external repositories under @repos/

- Use vendored repositories as read-only reference material when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do not edit files under @repos/ unless explicitly asked
- Do not import from @repos/ - application code should continue importing from normal package dependencies

When writing Effect code, inspect @repos/effect/ for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns. Always read @repos/effect/LLMS.md before writing Effect code. `repos/effect` is pinned to the installed `effect` version (tag `effect@4.1.7`); update both together:

```bash
git subtree pull --prefix=repos/effect https://github.com/Effect-TS/effect.git effect@<version> --squash
```

## Deploys

Pushing `main` deploys. GitHub Actions validates, then deploys to Dokku on the RackNerd server (`ssh racknerd`). The website deploys from Vercel. After pushing, watch the run: `gh run list --commit <sha>` then `gh run watch <id> --exit-status`.
