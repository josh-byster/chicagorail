# Research: Fast Metra Train Tracker

**Date**: 2025-10-11
**Phase**: 0 - Technical Research
**Status**: Complete

## Overview

This document addresses technical uncertainties from the planning phase and provides evidence-based recommendations for the Metra train tracking PWA implementation.

## 1. Backend Storage Strategy

### Decision
**SQLite with node-gtfs library**

### Rationale
- For 100-1000 daily users, SQLite provides excellent read performance (100k+ SELECTs/sec with tuning)
- node-gtfs library is specifically designed for GTFS data with optimized SQLite schema
- Zero deployment cost (no separate database server needed on DigitalOcean)
- Saves $15-22/month compared to managed PostgreSQL
- SQLite's WAL mode enables concurrent reads while writing, perfect for read-heavy use case
- File-based storage simplifies deployment on DigitalOcean App Platform or Droplets

### Alternatives Considered
- **PostgreSQL**: Better for 1000+ concurrent users, but overkill for current scale. Would cost $15/month minimum for managed instance. MVCC provides superior concurrency but adds unnecessary complexity.
- **Redis**: Excellent for caching but lacks GTFS-specific structure. Would require additional storage layer. Best used as cache layer on top of SQLite if scaling beyond 1000 users.

### Implementation Notes
- Enable WAL mode: `PRAGMA journal_mode=WAL;`
- Use `PRAGMA optimize` before closing connections
- Create indexes on frequently queried fields (station_id, route_id, stop_times)
- Run `PRAGMA analysis_limit=1000` periodically for query optimization
- Deploy SQLite file alongside Node.js app on single DigitalOcean droplet/App Platform instance

---

## 2. GTFS API Rate Limits & Polling Strategy

### Decision
**Poll every 30 seconds with If-Modified-Since headers**

### Rationale
- Metra updates realtime data every 30 seconds - no benefit polling faster
- Official GTFS Realtime best practices recommend 1-60 second intervals; 30s is industry standard
- If-Modified-Since HTTP headers prevent transferring unchanged data, saving bandwidth
- Meets spec requirement SC-002: "updates no more than 30 seconds stale"

### Alternatives Considered
- **10-15 second polling**: Unnecessary - Metra doesn't update faster than 30s, would waste API quota
- **60+ second polling**: Would violate 30-second freshness requirement
- **WebSocket/streaming**: Not supported by standard GTFS Realtime Protocol Buffer feeds

### Implementation Notes
- Metra requires API key (sign license agreement at metra.com/gtfs-realtime-api-key-request-license-agreement)
- **CRITICAL**: Per Metra terms - redistribute data through YOUR server, don't direct users to Metra's APIs
- Implement exponential backoff if API returns 429 (rate limited) or 5xx errors
- Use `If-Modified-Since` header to reduce bandwidth: `fetch(url, { headers: { 'If-Modified-Since': lastModified }})`
- Cache GTFS-realtime responses for 30 seconds server-side
- Implement circuit breaker pattern: if API fails 3 times, use cached data and reduce polling frequency temporarily
- Monitor for <1% invalid/error responses (GTFS best practice threshold)

---

## 3. GTFS Library Selection

### Decision
**Use node-gtfs (v4.18.0+) for static GTFS and realtime data**

### Rationale
- node-gtfs handles both static GTFS import and realtime updates into same SQLite database
- Uses `SQLITE REPLACE` for efficient realtime data updates
- Built-in spatial queries for nearby stops/routes (useful for future location features)
- Actively maintained (recent updates)
- Exports to GeoJSON format for map visualizations
- Provides query methods optimized for transit use cases

### Alternatives Considered
- **gtfs-realtime-bindings**: Lower-level Protocol Buffer parsing only, no database integration
- **gtfs-utils**: More memory-efficient but lacks realtime support and database persistence
- **Custom implementation**: Would require months to replicate node-gtfs's optimizations

### Implementation Notes

**API Endpoints**: Metra provides JSON GTFS feeds (not traditional zip files)

**Static Data Endpoints** (base: `https://gtfsapi.metrarail.com`):
- `/gtfs/schedule/stops` - Station data
- `/gtfs/schedule/stop_times` - Stop times
- `/gtfs/schedule/trips` - Trip information
- `/gtfs/schedule/routes` - Line/route data
- `/gtfs/schedule/calendar` - Service calendar
- `/gtfs/schedule/agency` - Agency info

**Realtime Data Endpoints**:
- `https://gtfsapi.metrarail.com/gtfs/alerts` - Service alerts
- `https://gtfsapi.metrarail.com/gtfs/tripUpdates` - Trip updates/delays
- `https://gtfsapi.metrarail.com/gtfs/positions` - Vehicle positions

**Authentication**: HTTP Basic Auth (credentials in `.env` file)

```typescript
// HTTP Basic Auth helper
const getAuthHeader = () => {
  const auth = btoa(`${process.env.METRA_API_USERNAME}:${process.env.METRA_API_PASSWORD}`);
  return { 'Authorization': `Basic ${auth}` };
};

// Fetch static data (example: stops)
const fetchStops = async () => {
  const response = await fetch(
    `${process.env.GTFS_STATIC_BASE_URL}/gtfs/schedule/stops`,
    { headers: getAuthHeader() }
  );
  return response.json();
};

// Fetch realtime updates (every 30 seconds)
setInterval(async () => {
  const [alerts, tripUpdates, positions] = await Promise.all([
    fetch(process.env.GTFS_REALTIME_ALERTS_URL, { headers: getAuthHeader() }),
    fetch(process.env.GTFS_REALTIME_TRIP_UPDATES_URL, { headers: getAuthHeader() }),
    fetch(process.env.GTFS_REALTIME_POSITIONS_URL, { headers: getAuthHeader() })
  ]);

  // Process and merge realtime data with static schedule
  // Store in SQLite for quick querying
}, 30000);
```

**Note**: Since Metra provides JSON endpoints instead of GTFS zip files, you may need to implement custom import logic rather than using node-gtfs's `importGtfs` directly. Consider fetching JSON endpoints and inserting into SQLite with the same schema node-gtfs expects.

---

## 4. PWA Architecture & Offline Strategy

### Decision
**Workbox with Network First + Cache First hybrid strategy, IndexedDB for schedules**

### Rationale
- **Network First** for realtime API calls (always try fresh data, fallback to cache if offline)
- **Cache First** for static assets (HTML, CSS, JS, images) for instant loading
- IndexedDB stores structured GTFS schedule data (routes, stops, timetables) - handles 100MB+ transit data
- Workbox provides production-ready service worker with minimal config
- Integrated into Vite, Create-React-App, Next.js

### Alternatives Considered
- **Stale-While-Revalidate**: Not suitable for realtime transit - users need current data, not 30-60 second old cached positions
- **Network Only**: Breaks offline requirement (FR-010)
- **Cache Only**: Would show stale data even when online

### Implementation Notes

**Service Worker Strategy**:
```typescript
// workbox-config.js
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';

// API calls - Network First with 30s cache fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/trains'),
  new NetworkFirst({
    cacheName: 'realtime-api',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 30,
        maxEntries: 50
      })
    ]
  })
);

// Static assets - Cache First
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })
    ]
  })
);
```

**IndexedDB Strategy**:
- Store GTFS static data (routes, stops, schedules) in IndexedDB
- Update weekly or on app update
- Query locally for route planning, reducing API calls
- Use Dexie.js for easier IndexedDB API:

```typescript
import Dexie from 'dexie';

class MetraDB extends Dexie {
  routes: Dexie.Table<Route, string>;
  stops: Dexie.Table<Stop, string>;
  stopTimes: Dexie.Table<StopTime, number>;

  constructor() {
    super('MetraDB');
    this.version(1).stores({
      routes: 'route_id, route_short_name',
      stops: 'stop_id, stop_name',
      stopTimes: '++id, trip_id, stop_id, arrival_time'
    });
  }
}
```

**Additional Requirements**:
- Show "Last updated: X minutes ago" when offline (FR-010)
- Use Workbox Background Sync to queue failed API requests when offline
- Precache critical routes using Workbox precaching for app shell

---

## 5. UI Component Library Selection

### Decision
**ShadCN UI with Tailwind CSS**

### Rationale
- Lightweight: ~150KB vs Material UI's 300KB for comparable projects
- Modular - only include components you need (tree-shaking friendly)
- Built on Radix UI (accessible by default, meets WCAG 2.1 Level AA requirement SC-009)
- Tailwind CSS integration enables PurgeCSS - only used utilities in bundle
- Copy-paste approach means full control over components (important for PWA customizations)
- Meets constitution bundle size requirement: <500KB gzipped

### Alternatives Considered
- **Material UI**: Heavier bundle, harder to customize for mobile-first PWA
- **Chakra UI**: Good option but larger bundle than ShadCN
- **Headless UI + Tailwind**: More setup required, ShadCN provides this out-of-box

### Implementation Notes

**Known Issues to Avoid**:
- Some users report rendering issues on mobile <768px width - test thoroughly on mobile breakpoints
- ShadCN components become YOUR code - updates require manual copy-paste (not npm update)
- No built-in data grid/charts - use Recharts or Chart.js separately if needed

**Performance Optimizations**:
```typescript
// Only import components you need
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

// Lazy load heavy components
const TrainMap = lazy(() => import('@/components/TrainMap'));

// Tailwind purge config
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Only includes used classes
}
```

**Mobile-First Best Practices**:
- Use ShadCN Drawer component for mobile (not Dialog/Modal)
- Test on actual devices, not just browser DevTools
- Use `touch-action` CSS for better touch responsiveness
- Implement `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`
- Test with Chrome Lighthouse PWA audit (target score: 90+)

**PWA-Specific Considerations**:
- Add manifest.json with ShadCN theme colors for consistent app icon/splash screen
- Use ShadCN's theme provider for light/dark mode (respects user's system preference)
- Ensure focus states work for keyboard navigation (Radix UI handles this by default)

---

## Architecture Summary

```
┌─────────────────────────────────────────┐
│         Frontend (PWA)                   │
│  ┌────────────────────────────────────┐ │
│  │ React + TypeScript + ShadCN UI     │ │
│  │ Workbox Service Worker              │ │
│  │ IndexedDB (GTFS schedules)         │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ HTTPS/REST
┌─────────────────▼───────────────────────┐
│      Backend (Node.js/Express)          │
│  ┌────────────────────────────────────┐ │
│  │ node-gtfs + SQLite (WAL mode)      │ │
│  │ 30s polling of Metra GTFS RT       │ │
│  │ REST API endpoints                  │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ HTTPS (30s poll)
┌─────────────────▼───────────────────────┐
│       Metra GTFS Realtime API           │
└─────────────────────────────────────────┘
```

**Deployment**: DigitalOcean App Platform (~$5-12/mo)

**Cost Estimate**:
- DigitalOcean App Platform: $5-12/month (Basic plan)
- No database hosting cost (SQLite embedded)
- Domain + SSL: ~$12/year (optional, App Platform provides free subdomain)
- **Total: ~$60-150/year**

---

## Technology Stack Summary

### Frontend
- **Framework**: React 18+ with TypeScript 5.x
- **Build Tool**: Vite (fast HMR, optimized builds)
- **UI Library**: ShadCN UI + Tailwind CSS
- **State Management**: TanStack Query (server state), React Context (client state)
- **PWA**: Workbox (service worker), Dexie.js (IndexedDB)
- **Testing**: Vitest, React Testing Library, Playwright

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express
- **Database**: SQLite with WAL mode
- **GTFS Integration**: node-gtfs library
- **Validation**: Zod (shared with frontend)
- **Testing**: Vitest, Supertest

### Shared
- **Language**: TypeScript 5.x
- **Package Manager**: pnpm (monorepo workspaces)
- **Schema Validation**: Zod
- **Type Sharing**: TypeScript path aliases

### DevOps
- **CI/CD**: GitHub Actions
- **Deployment**: DigitalOcean App Platform
- **Containerization**: Docker
- **Monitoring**: TBD (consider Sentry for error tracking)

---

## Resolved Clarifications

### From Technical Context

1. **Backend persistence strategy**: SQLite (no separate database server needed)
2. **GTFS API rate limits**: 30-second polling interval with If-Modified-Since headers

### Additional Decisions

3. **Package manager**: pnpm (better monorepo support than npm/yarn)
4. **Build tool**: Vite (faster than webpack, better DX)
5. **State management**: TanStack Query for server state (built-in caching, refetching)
6. **IndexedDB wrapper**: Dexie.js (simpler API than raw IndexedDB)

---

## Next Phase

With research complete, proceed to Phase 1:
- Generate data-model.md (entity definitions)
- Create API contracts in contracts/ directory
- Write quickstart.md (setup instructions)
- Update agent context file
