# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chicago Rail is a TypeScript monorepo for tracking Metra train departures in real-time. It uses PNPM workspaces with three packages: shared types/utilities, Express backend API, and React frontend.

## Development Commands

```bash
# Initial setup (required before first run)
pnpm install
pnpm run shared:build

# Development
pnpm run dev                 # Run all packages in parallel
pnpm run backend:dev         # Backend only (port 3000)
pnpm run frontend:dev        # Frontend only (port 5173)

# Building
pnpm run build               # Build all packages
pnpm run shared:build        # Build shared package only
```

**Important**: The shared package must be built before running backend or frontend, as both depend on `@chicagorail/shared`.

## Architecture

### Monorepo Structure

This is a PNPM workspace monorepo with three interdependent packages:

1. **`@chicagorail/shared`** - Source of truth for all types
   - GTFS domain types (Route, Stop, Trip, StopTime, Departure)
   - API request/response contracts
   - Shared utilities (time formatting, search ranking)
   - Built to `dist/` which is consumed by backend and frontend

2. **`@chicagorail/backend`** - Express REST API
   - Imports types from `@chicagorail/shared`
   - Uses ESM modules (not CommonJS)
   - Runs with `tsx watch` for hot reload during development

3. **`@chicagorail/frontend`** - React + Vite SPA
   - Imports types from `@chicagorail/shared`
   - Uses ShadCN UI components (in `src/components/ui/`)
   - Custom hooks pattern for data fetching

### GTFS Data Flow

The backend implements critical GTFS schedule logic:

1. **Data Location**: GTFS files live in `schedule/` directory at repo root (not inside backend package)
2. **Singleton Service**: `GTFSService` is a singleton that:
   - Downloads/caches GTFS ZIP from Metra API
   - Parses CSV files (routes.txt, stops.txt, trips.txt, stop_times.txt, calendar.txt)
   - Builds in-memory indexes (stopsByIdMap, routesByStopMap) for fast lookups
   - TTL cache of 24 hours

3. **Time Conversion**: GTFS times are in "HH:MM:SS" format (can exceed 24:00:00 for next-day service). The `gtfsTimeToISO()` method converts these to ISO datetime strings based on the query date.

4. **Service Period Filtering**: The `isServiceActiveOnDate()` method checks:
   - Day of week (monday/tuesday/etc. fields in calendar.txt)
   - Date range (start_date/end_date in YYYYMMDD format)
   - Only trips with active services are returned

5. **Departure vs Arrival**: Departures are filtered by excluding trips where `trip_headsign` contains the current station name (those are arrivals).

### API Endpoints

- `GET /api/routes` - All Metra routes
- `GET /api/stops/search?q=<query>` - Fuzzy search stations (uses `rankSearchResults` from shared)
- `GET /api/stops/:stopId/departures?date=&limit=&routeId=` - Departures from a station
  - Filters by service period (only active today)
  - Filters out arrivals (trains heading TO this station)
  - Filters out past departures
  - Sorted by departure time

### Frontend Architecture

- **State Management**: React hooks (no Redux/Context)
- **Data Fetching**: Custom hooks (`useStationSearch`, `useDepartures`, `useRecentStops`)
- **Auto-refresh**: `useDepartures` polls every 30 seconds
- **Local Storage**: Recent searches stored as JSON array of Stop objects
- **API Client**: Type-safe wrapper in `src/lib/api.ts` using shared types

## Type Safety Rules

**Never duplicate types between packages.** All domain and API types must live in `@chicagorail/shared`:

- If backend needs a new type, add it to `packages/shared/src/types/`
- If frontend needs to know the shape of API responses, use types from `@chicagorail/shared`
- Rebuild shared package (`pnpm run shared:build`) after type changes

## Environment Variables

Backend requires `.env` file in `packages/backend/`:
```
PORT=3000
NODE_ENV=development
GTFS_UPDATE_INTERVAL=86400000
```

Frontend requires `.env` file in `packages/frontend/`:
```
VITE_API_URL=http://localhost:3000/api
```

See `.env.example` files in each package for templates.

## Key Implementation Details

### GTFS Schedule Path Resolution

The backend service resolves the GTFS directory relative to the compiled output:
```typescript
const GTFS_DIR = path.join(__dirname, '..', '..', '..', '..', 'schedule')
```
This works because:
- Source: `packages/backend/src/services/gtfsService.ts`
- Compiled: `packages/backend/dist/services/gtfsService.js`
- Target: `schedule/` (4 levels up from compiled location)

### Workspace Dependencies

Packages use `workspace:*` protocol for internal dependencies:
```json
{
  "dependencies": {
    "@chicagorail/shared": "workspace:*"
  }
}
```

PNPM resolves these to the local workspace packages, not npm registry.

## Common Issues

**"Module not found: @chicagorail/shared"**: Run `pnpm run shared:build` - the shared package must be built before backend/frontend can import it.

**Backend can't find GTFS files**: The `schedule/` directory should be at repo root. If moved, update `GTFS_DIR` path resolution in `gtfsService.ts`.

**Type mismatches between packages**: Ensure you're importing from `@chicagorail/shared` and not redefining types locally. Rebuild shared after changes.
