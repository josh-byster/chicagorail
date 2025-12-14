# Chicago Rail - Technical Specification
## Monorepo Architecture with Shared Types

### Overview
This spec outlines the restructuring of the Chicago Rail app into a clean TypeScript monorepo with:
- **Backend**: Express REST API serving GTFS data
- **Frontend**: React + ShadCN UI for power users
- **Shared**: Common types, utilities, and validation logic

---

## Project Structure

```
chicagorail/
├── package.json                 # Root package.json for workspace
├── pnpm-workspace.yaml         # PNPM workspace config
├── tsconfig.base.json          # Base TypeScript config
├── .gitignore
│
├── packages/
│   ├── shared/                 # Shared types & utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/
│   │       │   ├── api.ts      # API request/response types
│   │       │   ├── gtfs.ts     # GTFS domain types
│   │       │   └── index.ts
│   │       ├── utils/
│   │       │   ├── time.ts     # Time formatting utilities
│   │       │   ├── search.ts   # Fuzzy search utilities
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── backend/                # Express API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── routes/         # API routes
│   │       │   ├── routes.ts
│   │       │   ├── stops.ts
│   │       │   └── trips.ts
│   │       ├── services/
│   │       │   └── gtfsService.ts
│   │       ├── middleware/
│   │       │   ├── errorHandler.ts
│   │       │   └── logger.ts
│   │       ├── utils/
│   │       │   └── validators.ts
│   │       └── index.ts
│   │
│   └── frontend/               # React SPA
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── src/
│           ├── components/
│           │   ├── ui/         # ShadCN components
│           │   ├── StationSearch.tsx
│           │   ├── DepartureBoard.tsx
│           │   ├── DepartureRow.tsx
│           │   └── LineFilter.tsx
│           ├── hooks/
│           │   ├── useStations.ts
│           │   ├── useDepartures.ts
│           │   └── useRecent.ts
│           ├── lib/
│           │   ├── api.ts      # API client
│           │   └── utils.ts
│           ├── App.tsx
│           └── main.tsx
│
└── schedule/                   # GTFS data (shared by backend)
```

---

## Package: `@chicagorail/shared`

### Purpose
Centralized type definitions and utilities shared between frontend and backend.

### Key Files

#### `src/types/gtfs.ts`
```typescript
// GTFS Domain Types (moved from backend/src/types.ts)
export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_color: string;
  route_text_color: string;
  route_url: string;
}

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_desc: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  trip_headsign: string;
  direction_id: number;
  service_id: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

export interface Departure {
  route: Route;
  trip_headsign: string;
  departure_time: string;
  arrival_time: string;
  direction: 'inbound' | 'outbound';
  trip_id: string;
}
```

#### `src/types/api.ts`
```typescript
// API Request/Response Types
import { Route, Stop, Departure } from './gtfs';

// GET /api/routes
export interface GetRoutesResponse {
  routes: Route[];
}

// GET /api/search/stops?q=
export interface SearchStopsRequest {
  q: string;
}

export interface SearchStopsResponse {
  stops: Stop[];
}

// GET /api/stops/:stopId/departures?date=&limit=
export interface GetDeparturesRequest {
  stopId: string;
  date?: string; // ISO date string
  limit?: number;
  routeId?: string; // Optional route filter
}

export interface GetDeparturesResponse {
  stop: Stop;
  departures: Departure[];
  timestamp: string;
}

// Error response
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
```

#### `src/utils/time.ts`
```typescript
// Shared time utilities
export function getRelativeTime(departureTime: string): string {
  const now = new Date();
  const departure = new Date(departureTime);
  const diffMs = departure.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin} min`;

  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}h ${mins}m`;
}

export function formatTime(time: string): string {
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
```

#### `src/utils/search.ts`
```typescript
// Fuzzy search utility
export function fuzzyMatch(query: string, target: string): boolean {
  query = query.toLowerCase();
  target = target.toLowerCase();

  let queryIndex = 0;
  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === query.length;
}

export function rankSearchResults<T extends { stop_name: string }>(
  query: string,
  items: T[]
): T[] {
  const q = query.toLowerCase();

  return items
    .map(item => ({
      item,
      score: item.stop_name.toLowerCase().startsWith(q) ? 2 :
             item.stop_name.toLowerCase().includes(q) ? 1 : 0
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
```

### package.json
```json
{
  "name": "@chicagorail/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

---

## Package: `@chicagorail/backend`

### Updated Structure

#### `src/routes/stops.ts`
```typescript
import { Router } from 'express';
import { GTFSService } from '../services/gtfsService';
import {
  SearchStopsRequest,
  SearchStopsResponse,
  GetDeparturesRequest,
  GetDeparturesResponse,
  ApiError
} from '@chicagorail/shared';
import { rankSearchResults } from '@chicagorail/shared/utils';

const router = Router();
const gtfsService = GTFSService.getInstance();

// Search stops
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query as SearchStopsRequest;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters',
        code: 'INVALID_QUERY'
      } as ApiError);
    }

    const data = await gtfsService.getData();
    const matchingStops = data.stops.filter(stop =>
      stop.stop_name.toLowerCase().includes(q.toLowerCase())
    );

    const rankedStops = rankSearchResults(q, matchingStops);

    res.json({
      stops: rankedStops.slice(0, 10) // Limit to 10 results
    } as SearchStopsResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search stops',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

// Get departures for a stop
router.get('/:stopId/departures', async (req, res) => {
  try {
    const { stopId } = req.params;
    const { date, limit = 20, routeId } = req.query as GetDeparturesRequest;

    const departures = await gtfsService.getDeparturesForStop(
      stopId,
      date ? new Date(date) : new Date(),
      Number(limit),
      routeId
    );

    res.json({
      stop: departures.stop,
      departures: departures.departures,
      timestamp: new Date().toISOString()
    } as GetDeparturesResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch departures',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

export default router;
```

#### `src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import routesRouter from './routes/routes';
import stopsRouter from './routes/stops';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://www.chicagorail.app',
    'https://chicagorail.app',
    'http://localhost:3001',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(logger);

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/routes', routesRouter);
app.use('/api/stops', stopsRouter);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
```

#### Updated `src/services/gtfsService.ts`
Add new method:
```typescript
public async getDeparturesForStop(
  stopId: string,
  date: Date,
  limit: number = 20,
  routeIdFilter?: string
): Promise<{ stop: Stop; departures: Departure[] }> {
  const data = await this.getData();
  const stop = data.stops.find(s => s.stop_id === stopId);

  if (!stop) {
    throw new Error('Stop not found');
  }

  // Get all stop times for this stop
  const stopTimes = data.stopTimes.filter(st => st.stop_id === stopId);

  // Build departures with route info
  const departures = stopTimes
    .map(st => {
      const trip = data.trips.find(t => t.trip_id === st.trip_id);
      if (!trip) return null;

      const route = data.routes.find(r => r.route_id === trip.route_id);
      if (!route) return null;

      if (routeIdFilter && route.route_id !== routeIdFilter) {
        return null;
      }

      return {
        route,
        trip_headsign: trip.trip_headsign,
        departure_time: st.departure_time,
        arrival_time: st.arrival_time,
        direction: trip.direction_id === 0 ? 'outbound' : 'inbound',
        trip_id: trip.trip_id
      } as Departure;
    })
    .filter(Boolean)
    .slice(0, limit);

  return { stop, departures };
}
```

### package.json updates
```json
{
  "name": "@chicagorail/backend",
  "dependencies": {
    "@chicagorail/shared": "workspace:*",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "adm-zip": "^0.5.16",
    "winston": "^3.11.0"
  }
}
```

---

## Package: `@chicagorail/frontend`

### API Client (`src/lib/api.ts`)
```typescript
import type {
  GetRoutesResponse,
  SearchStopsResponse,
  GetDeparturesResponse,
  ApiError
} from '@chicagorail/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error);
    }

    return response.json();
  }

  async getRoutes() {
    return this.fetch<GetRoutesResponse>('/routes');
  }

  async searchStops(query: string) {
    return this.fetch<SearchStopsResponse>(`/stops/search?q=${encodeURIComponent(query)}`);
  }

  async getDepartures(stopId: string, routeId?: string) {
    const params = new URLSearchParams();
    if (routeId) params.set('routeId', routeId);

    const endpoint = `/stops/${stopId}/departures?${params}`;
    return this.fetch<GetDeparturesResponse>(endpoint);
  }
}

export const api = new ApiClient();
```

### Hooks

#### `src/hooks/useStations.ts`
```typescript
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Stop } from '@chicagorail/shared';

export function useStationSearch(query: string) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setStops([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const result = await api.searchStops(query);
        setStops(result.stops);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  return { stops, loading };
}
```

#### `src/hooks/useDepartures.ts`
```typescript
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Stop, Departure } from '@chicagorail/shared';

export function useDepartures(stopId: string | null, routeFilter?: string) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [stop, setStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stopId) return;

    const fetchDepartures = async () => {
      setLoading(true);
      try {
        const result = await api.getDepartures(stopId, routeFilter);
        setStop(result.stop);
        setDepartures(result.departures);
      } catch (error) {
        console.error('Failed to fetch departures:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartures();
    const interval = setInterval(fetchDepartures, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [stopId, routeFilter]);

  return { stop, departures, loading };
}
```

### Components

#### `src/components/DepartureRow.tsx`
```typescript
import { getRelativeTime, formatTime } from '@chicagorail/shared/utils';
import type { Departure } from '@chicagorail/shared';

interface DepartureRowProps {
  departure: Departure;
}

export function DepartureRow({ departure }: DepartureRowProps) {
  const { route, trip_headsign, departure_time, direction } = departure;

  return (
    <div className="flex items-center justify-between py-3 px-4 border-b hover:bg-accent/50">
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-1 h-12 rounded"
          style={{ backgroundColor: `#${route.route_color}` }}
        />
        <div>
          <div className="font-medium">{route.route_short_name}</div>
          <div className="text-sm text-muted-foreground">
            {trip_headsign}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">
          {getRelativeTime(departure_time)}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(departure_time)}
        </div>
      </div>
    </div>
  );
}
```

### package.json updates
```json
{
  "name": "@chicagorail/frontend",
  "dependencies": {
    "@chicagorail/shared": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

---

## Root Configuration

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
```

### Root `package.json`
```json
{
  "name": "chicagorail",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --stream dev",
    "build": "pnpm --recursive --stream build",
    "backend:dev": "pnpm --filter @chicagorail/backend dev",
    "frontend:dev": "pnpm --filter @chicagorail/frontend dev",
    "shared:build": "pnpm --filter @chicagorail/shared build"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### `tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## API Endpoints Summary

### Current Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | Get all Metra routes |
| GET | `/api/search/stops?q=` | Search stops by name |
| GET | `/api/routes/:id/trips?date=` | Get trips for a route |

### Proposed New Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | Get all routes (unchanged) |
| GET | `/api/stops/search?q=` | Search stops (improved fuzzy search) |
| GET | `/api/stops/:stopId/departures?date=&limit=&routeId=` | **NEW** Get departures for a stop |

### Why the change?
The PRD shows users want:
1. Search for a **station**
2. See **departures** from that station

The current API requires:
1. Search stops
2. Get routes for those stops
3. Get trips for each route
4. Filter by stop

The new API simplifies to:
1. Search stops
2. Get departures for stop

---

## Migration Steps

1. **Create monorepo structure**
   - Move `backend/` → `packages/backend/`
   - Move `frontend/` → `packages/frontend/`
   - Create `packages/shared/`

2. **Set up shared package**
   - Move types from `backend/src/types.ts` → `shared/src/types/gtfs.ts`
   - Create API types in `shared/src/types/api.ts`
   - Create utilities in `shared/src/utils/`

3. **Update backend**
   - Install `@chicagorail/shared` dependency
   - Update imports to use shared types
   - Implement new `/stops/:id/departures` endpoint
   - Add `getDeparturesForStop` method to GTFSService

4. **Update frontend**
   - Install `@chicagorail/shared` dependency
   - Create API client using shared types
   - Create hooks for data fetching
   - Build ShadCN components (StationSearch, DepartureBoard, etc.)

5. **Testing**
   - Test API endpoints with curl/Postman
   - Test frontend components with mock data
   - End-to-end test of search → departures flow

---

## Environment Variables

### Backend (`.env`)
```
PORT=3000
NODE_ENV=development
GTFS_UPDATE_INTERVAL=86400000
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3000/api
```

---

## Development Workflow

```bash
# Install dependencies
pnpm install

# Build shared package first
pnpm run shared:build

# Start development
pnpm run dev                # Run all in parallel

# Or run individually
pnpm run backend:dev        # Backend on :3000
pnpm run frontend:dev       # Frontend on :5173
```

---

## MVP Features (Implementation Order)

1. **Shared Package** ✅
   - Types for GTFS, API
   - Time formatting utilities
   - Search utilities

2. **Backend** ✅
   - New `/stops/:id/departures` endpoint
   - Improved search with ranking
   - Error handling

3. **Frontend - Core**
   - API client
   - Station search with autocomplete
   - Departure board view
   - Recent stations (localStorage)

4. **Frontend - Polish**
   - Dark mode
   - Mobile responsive
   - Loading states
   - Error handling

---

## Success Criteria

- Single source of truth for types (no duplication)
- Frontend and backend use identical type definitions
- API responses are fully typed
- Time from search to departures < 500ms
- Mobile-first responsive design
- Clean, maintainable codebase
