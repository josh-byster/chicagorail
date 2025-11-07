# GTFS API Migration Plan

## Executive Summary

Metra has migrated from JSON-based GTFS endpoints to a standard GTFS feed system. This document outlines the migration plan to update our backend integration to work with the new system.

**Status**: API is currently BROKEN due to endpoint changes
**Priority**: CRITICAL
**Estimated Effort**: 1-2 days

---

## 1. What Changed

### Old System (BROKEN)
```
Static Data:  https://gtfsapi.metrarail.com/gtfs/schedule/* (JSON endpoints)
Realtime:     https://gtfsapi.metrarail.com/gtfs/* (JSON endpoints)
Auth:         Basic Auth (username + password)
Format:       JSON responses
```

### New System (WORKING)
```
Static Data:  https://schedules.metrarail.com/gtfs/schedule.zip (ZIP file)
Published:    https://schedules.metrarail.com/gtfs/published.txt (timestamp check)
Realtime:     https://gtfspublic.metrarr.com/gtfs/public/* (Protocol Buffers)
Auth:         Bearer token OR api_token query param
Format:       Standard GTFS (ZIP with .txt files) + GTFS-RT (protobuf)
```

**Key Changes:**
1. Static data moved from JSON endpoints to standard GTFS ZIP file
2. New domain for static data (`schedules.metrarail.com` - no auth required)
3. Realtime endpoints moved to new domain (`gtfspublic.metrarr.com`)
4. Authentication changed from Basic Auth to API token
5. Realtime data now uses Protocol Buffers (GTFS-RT standard) instead of JSON
6. Published timestamp file available to check for updates

---

## 2. Migration Strategy

### Phase 1: Environment & Configuration Updates
**Files to modify:**
- `.env.example`
- `packages/backend/src/config/env.ts`

**Changes:**
```env
# OLD - Remove these
METRA_API_USERNAME=your_username_here
METRA_API_PASSWORD=your_password_here
GTFS_STATIC_BASE_URL=https://gtfsapi.metrarail.com
GTFS_REALTIME_ALERTS_URL=https://gtfsapi.metrarail.com/gtfs/alerts
GTFS_REALTIME_TRIP_UPDATES_URL=https://gtfsapi.metrarail.com/gtfs/tripUpdates
GTFS_REALTIME_POSITIONS_URL=https://gtfsapi.metrarail.com/gtfs/positions

# NEW - Add these
METRA_API_TOKEN=your_api_token_here
GTFS_STATIC_SCHEDULE_URL=https://schedules.metrarail.com/gtfs/schedule.zip
GTFS_STATIC_PUBLISHED_URL=https://schedules.metrarail.com/gtfs/published.txt
GTFS_REALTIME_BASE_URL=https://gtfspublic.metrarr.com
GTFS_REALTIME_ALERTS_URL=https://gtfspublic.metrarr.com/gtfs/public/alerts
GTFS_REALTIME_TRIP_UPDATES_URL=https://gtfspublic.metrarr.com/gtfs/public/tripupdates
GTFS_REALTIME_POSITIONS_URL=https://gtfspublic.metrarr.com/gtfs/public/positions
```

**Update Zod schema in `env.ts`:**
```typescript
const envSchema = z.object({
  // Remove username/password
  // Add token
  METRA_API_TOKEN: z.string(),
  GTFS_STATIC_SCHEDULE_URL: z.string().url(),
  GTFS_STATIC_PUBLISHED_URL: z.string().url(),
  GTFS_REALTIME_BASE_URL: z.string().url(),
  GTFS_REALTIME_ALERTS_URL: z.string().url(),
  GTFS_REALTIME_TRIP_UPDATES_URL: z.string().url(),
  GTFS_REALTIME_POSITIONS_URL: z.string().url(),
  // ... rest
});
```

---

### Phase 2: Add Dependencies

**Install new packages:**
```bash
pnpm add --filter backend adm-zip gtfs-realtime-bindings
```

**Purpose:**
- `adm-zip`: Unzip the schedule.zip file
- `gtfs-realtime-bindings`: Parse GTFS-RT Protocol Buffer format

---

### Phase 3: Static Data Import Refactor

**File:** `packages/backend/src/services/gtfs-init.service.ts`

**Current implementation:**
- Fetches 7 separate JSON endpoints
- Uses Basic Auth
- Parses JSON directly
- Inserts into SQLite

**New implementation:**
1. Check `published.txt` for last update timestamp
2. Compare with stored timestamp (in database or file)
3. If changed, download `schedule.zip`
4. Extract ZIP to temp directory
5. Parse standard GTFS .txt files (CSV format):
   - `agency.txt`
   - `routes.txt`
   - `stops.txt`
   - `trips.txt`
   - `stop_times.txt`
   - `calendar.txt`
   - `calendar_dates.txt`
6. Insert into SQLite (same schema as before)
7. Store new published timestamp
8. Clean up temp files

**Key Implementation Details:**

```typescript
// New service structure
export const importGTFSStaticData = async (): Promise<void> => {
  console.log('📥 Importing GTFS static data from Metra...');

  // Step 1: Check published timestamp
  const publishedTimestamp = await fetchPublishedTimestamp();
  const lastImportedTimestamp = getLastImportedTimestamp();

  if (publishedTimestamp === lastImportedTimestamp) {
    console.log('✅ GTFS data is up to date, skipping import');
    return;
  }

  console.log(`  🆕 New data available (published: ${publishedTimestamp})`);

  // Step 2: Download schedule.zip
  const zipBuffer = await downloadScheduleZip();

  // Step 3: Extract ZIP
  const tempDir = extractZipToTemp(zipBuffer);

  // Step 4: Parse GTFS text files
  const gtfsData = parseGTFSFiles(tempDir);

  // Step 5: Insert into database (same as before)
  const db = getDatabase();
  createTables(db);
  insertAgencies(db, gtfsData.agencies);
  insertRoutes(db, gtfsData.routes);
  insertStops(db, gtfsData.stops);
  insertTrips(db, gtfsData.trips);
  insertStopTimes(db, gtfsData.stopTimes);
  insertCalendar(db, gtfsData.calendar);
  insertCalendarDates(db, gtfsData.calendarDates);
  createIndexes(db);
  deriveLinesServed(db);

  // Step 6: Save published timestamp
  saveLastImportedTimestamp(publishedTimestamp);

  // Step 7: Cleanup
  cleanupTempDir(tempDir);

  console.log('✅ GTFS static data import complete!');
};

// Helper functions
const fetchPublishedTimestamp = async (): Promise<string> => {
  const response = await fetch(env.GTFS_STATIC_PUBLISHED_URL);
  return (await response.text()).trim();
};

const downloadScheduleZip = async (): Promise<Buffer> => {
  const response = await fetch(env.GTFS_STATIC_SCHEDULE_URL);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const extractZipToTemp = (zipBuffer: Buffer): string => {
  const zip = new AdmZip(zipBuffer);
  const tempDir = path.join(os.tmpdir(), `gtfs-${Date.now()}`);
  zip.extractAllTo(tempDir, true);
  return tempDir;
};

const parseGTFSFiles = (tempDir: string): GTFSData => {
  // Parse CSV files using csv-parse or similar
  return {
    agencies: parseCSV(path.join(tempDir, 'agency.txt')),
    routes: parseCSV(path.join(tempDir, 'routes.txt')),
    stops: parseCSV(path.join(tempDir, 'stops.txt')),
    trips: parseCSV(path.join(tempDir, 'trips.txt')),
    stopTimes: parseCSV(path.join(tempDir, 'stop_times.txt')),
    calendar: parseCSV(path.join(tempDir, 'calendar.txt')),
    calendarDates: parseCSV(path.join(tempDir, 'calendar_dates.txt')),
  };
};

// Store timestamp in database for persistence
const getLastImportedTimestamp = (): string | null => {
  const db = getDatabase();
  try {
    const result = db.prepare('SELECT value FROM metadata WHERE key = ?').get('last_published_timestamp');
    return result?.value || null;
  } catch {
    return null;
  }
};

const saveLastImportedTimestamp = (timestamp: string): void => {
  const db = getDatabase();
  db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)').run('last_published_timestamp', timestamp);
};
```

**Add metadata table:**
```typescript
// In createTables()
db.exec(`
  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);
```

---

### Phase 4: Realtime Data Refactor

**File:** `packages/backend/src/services/gtfs-realtime.service.ts`

**Changes needed:**
1. Update authentication from Basic Auth to Bearer token
2. Update endpoint URLs
3. Parse Protocol Buffer format instead of JSON
4. Handle GTFS-RT message structure

**New implementation:**

```typescript
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

// Updated auth helper
const getAuthHeader = (): { Authorization: string } => {
  return { Authorization: `Bearer ${env.METRA_API_TOKEN}` };
};

// Alternative: Use query param (if preferred)
const getAuthQueryParam = (): string => {
  return `?api_token=${env.METRA_API_TOKEN}`;
};

// Updated fetch function
const fetchRealtimeEndpoint = async (
  url: string,
  lastModified?: string | null
): Promise<{ data: any; lastModified: string | null }> => {
  const headers: any = {
    ...getAuthHeader(),
    'Accept': 'application/x-protobuf', // Request protobuf format
  };

  if (lastModified) {
    headers['If-Modified-Since'] = lastModified;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return { data: null, lastModified: null };
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch realtime data: ${response.status} ${response.statusText}`
    );
  }

  const newLastModified = response.headers.get('Last-Modified');

  // Parse Protocol Buffer format
  const buffer = await response.arrayBuffer();
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );

  return { data: feed, lastModified: newLastModified };
};

// Updated polling function
export const pollGTFSRealtimeData = async (): Promise<void> => {
  console.log('📡 Polling GTFS realtime data...');

  try {
    // Fetch alerts
    const alertsResponse = await fetchRealtimeEndpoint(
      env.GTFS_REALTIME_ALERTS_URL,
      lastAlertsModified
    );

    if (alertsResponse.data) {
      // Extract alerts from protobuf structure
      realtimeAlerts = alertsResponse.data.entity
        .filter((e: any) => e.alert)
        .map((e: any) => e.alert);
      lastAlertsModified = alertsResponse.lastModified;
    }

    // Similar for trip updates
    const tripUpdatesResponse = await fetchRealtimeEndpoint(
      env.GTFS_REALTIME_TRIP_UPDATES_URL,
      lastTripUpdatesModified
    );

    if (tripUpdatesResponse.data) {
      realtimeTripUpdates = tripUpdatesResponse.data.entity
        .filter((e: any) => e.tripUpdate)
        .map((e: any) => e.tripUpdate);
      lastTripUpdatesModified = tripUpdatesResponse.lastModified;
    }

    // Similar for vehicle positions
    const positionsResponse = await fetchRealtimeEndpoint(
      env.GTFS_REALTIME_POSITIONS_URL,
      lastPositionsModified
    );

    if (positionsResponse.data) {
      realtimeVehiclePositions = positionsResponse.data.entity
        .filter((e: any) => e.vehicle)
        .map((e: any) => e.vehicle);
      lastPositionsModified = positionsResponse.lastModified;
    }

    console.log('✅ GTFS realtime polling cycle complete!');
  } catch (error) {
    console.error('❌ GTFS realtime polling failed:', error);
    throw error;
  }
};
```

**GTFS-RT Message Structure:**
```
FeedMessage
├── header
│   ├── gtfsRealtimeVersion
│   ├── incrementality
│   └── timestamp
└── entity[] (array of FeedEntity)
    ├── id
    ├── alert (for alerts feed)
    ├── tripUpdate (for trip updates feed)
    └── vehicle (for vehicle positions feed)
```

---

### Phase 5: Update Scripts

**Files:**
- `packages/backend/src/scripts/import-gtfs.ts` (no changes needed)
- `packages/backend/src/scripts/snapshot-api.ts` (update for new endpoints)
- `packages/backend/src/scripts/validate-gtfs-api.ts` (update for new endpoints)

---

### Phase 6: Documentation Updates

**Files to update:**
- `CLAUDE.md` - Update API documentation
- `README.md` - Update setup instructions
- `.env.example` - Already covered in Phase 1

**Key documentation points:**
1. How to obtain API token (link to form: https://gtfspublic.metrarr.com/request-key or similar)
2. New endpoint URLs
3. Updated polling behavior (check published.txt)
4. Protocol Buffer format for realtime data

---

## 3. Implementation Checklist

### Pre-Migration
- [ ] Request new API token from Metra (if needed)
- [ ] Back up current `.env` file
- [ ] Back up current `gtfs.db` database
- [ ] Create feature branch: `git checkout -b fix/gtfs-api-migration`

### Phase 1: Environment
- [ ] Update `.env.example` with new variables
- [ ] Update `env.ts` Zod schema
- [ ] Update actual `.env` file with new credentials
- [ ] Test env validation works

### Phase 2: Dependencies
- [ ] Install `adm-zip`
- [ ] Install `gtfs-realtime-bindings`
- [ ] Install `csv-parse` (for parsing GTFS text files)
- [ ] Verify all packages installed: `pnpm install`

### Phase 3: Static Data Import
- [ ] Add metadata table creation to `createTables()`
- [ ] Implement `fetchPublishedTimestamp()`
- [ ] Implement `downloadScheduleZip()`
- [ ] Implement `extractZipToTemp()`
- [ ] Implement `parseGTFSFiles()` with CSV parsing
- [ ] Implement timestamp persistence helpers
- [ ] Update `importGTFSStaticData()` main function
- [ ] Keep existing insert/transform logic (no changes needed)
- [ ] Test with: `pnpm gtfs:import`

### Phase 4: Realtime Data
- [ ] Update `getAuthHeader()` to use Bearer token
- [ ] Update endpoint URLs in config
- [ ] Update `fetchRealtimeEndpoint()` to parse protobuf
- [ ] Update `pollGTFSRealtimeData()` to extract entities
- [ ] Handle GTFS-RT message structure
- [ ] Test realtime polling

### Phase 5: Scripts
- [ ] Update `snapshot-api.ts` for new endpoints
- [ ] Update `validate-gtfs-api.ts` for new endpoints
- [ ] Test all scripts

### Phase 6: Integration Testing
- [ ] Delete existing `gtfs.db` to force fresh import
- [ ] Start backend: `pnpm dev`
- [ ] Verify startup import works
- [ ] Test API endpoints:
  - `GET /api/stations`
  - `GET /api/lines`
  - `GET /api/trains?origin=X&destination=Y`
  - `GET /api/alerts`
- [ ] Verify realtime data merging works
- [ ] Check logs for errors

### Phase 7: Documentation
- [ ] Update `CLAUDE.md`
- [ ] Update `README.md`
- [ ] Add migration notes to `CHANGELOG.md` (if exists)

### Phase 8: Deployment
- [ ] Commit changes with descriptive message
- [ ] Push to feature branch
- [ ] Create pull request
- [ ] Update production environment variables
- [ ] Deploy to production
- [ ] Monitor logs for errors

---

## 4. Testing Strategy

### Unit Tests
- [ ] Test CSV parsing handles all GTFS file formats
- [ ] Test ZIP extraction and cleanup
- [ ] Test timestamp comparison logic
- [ ] Test protobuf parsing for all three realtime feeds
- [ ] Test auth header generation

### Integration Tests
- [ ] Test full static import pipeline
- [ ] Test published.txt timestamp checking
- [ ] Test database schema creation
- [ ] Test realtime polling cycle
- [ ] Test data transformations (colors, wheelchair, lines_served)

### End-to-End Tests
- [ ] Test API responses match expected format
- [ ] Test realtime data merging
- [ ] Test cache behavior
- [ ] Test error handling (network failures, invalid data)

### Manual Testing
- [ ] Import fresh GTFS data
- [ ] Verify station count matches expected
- [ ] Verify route count matches expected
- [ ] Check realtime alerts display correctly
- [ ] Check train predictions work
- [ ] Test on frontend UI

---

## 5. Rollback Plan

If the migration fails:

1. **Revert code changes:**
   ```bash
   git checkout main
   git branch -D fix/gtfs-api-migration
   ```

2. **Restore environment:**
   - Restore backed-up `.env` file with old credentials
   - Restore backed-up `gtfs.db` database

3. **Restart backend:**
   ```bash
   pnpm dev
   ```

4. **Contact Metra:**
   - Ask if old JSON endpoints can be temporarily restored
   - Request support for new API integration

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| New API token not available | Low | High | Request token early; have backup plan |
| Protobuf parsing errors | Medium | High | Use official gtfs-realtime-bindings library |
| ZIP file format changes | Low | Medium | Test with multiple schedule versions |
| Database schema incompatibility | Low | Low | Schema should remain same (GTFS standard) |
| Realtime data structure changes | Medium | Medium | Add comprehensive error handling |
| Published timestamp not updated | Low | Low | Fall back to re-import every hour |
| Large ZIP download times | Low | Low | Only re-download when published.txt changes |

---

## 7. Post-Migration Verification

After successful migration, verify:

- [ ] Static data import completes without errors
- [ ] All 7 GTFS tables populated with data
- [ ] Realtime polling starts successfully
- [ ] All API endpoints return valid data
- [ ] Frontend displays train predictions correctly
- [ ] Alerts display correctly
- [ ] No errors in backend logs
- [ ] Database size is reasonable (~50-100 MB)
- [ ] Performance is acceptable (API latency <200ms)

---

## 8. Timeline

**Day 1 (4-6 hours):**
- Phases 1-2: Environment & dependencies
- Phase 3: Static data import refactor
- Initial testing

**Day 2 (4-6 hours):**
- Phase 4: Realtime data refactor
- Phases 5-6: Scripts & documentation
- Integration testing
- Deployment preparation

**Total estimated time: 8-12 hours**

---

## 9. Key Files Modified

| File | Type | Changes |
|------|------|---------|
| `.env.example` | Config | New env vars (token, new URLs) |
| `packages/backend/src/config/env.ts` | Config | Update Zod schema |
| `packages/backend/src/services/gtfs-init.service.ts` | Major | ZIP download, CSV parsing, timestamp checking |
| `packages/backend/src/services/gtfs-realtime.service.ts` | Major | Bearer auth, protobuf parsing |
| `packages/backend/src/scripts/snapshot-api.ts` | Minor | Update endpoints |
| `packages/backend/src/scripts/validate-gtfs-api.ts` | Minor | Update endpoints |
| `packages/backend/package.json` | Config | Add new dependencies |
| `CLAUDE.md` | Docs | Update API documentation |

---

## 10. Additional Notes

### Performance Considerations
- ZIP download is ~5-10 MB (reasonable)
- Published timestamp check is very fast (<100ms)
- Only re-import when schedule actually changes
- Consider adding data compression for database if it grows large

### Future Enhancements
- Add admin endpoint to manually trigger import
- Add health check for last successful import time
- Add monitoring/alerting for import failures
- Consider incremental updates if Metra supports it
- Add GTFS validation using gtfs-validator

### Alternative Approaches Considered
1. **Use node-gtfs library**: More heavyweight, less control over transformations
2. **Keep JSON endpoints**: Not possible - endpoints are deprecated
3. **Manual updates**: Not scalable, defeats purpose of automation

---

## 11. Support & Resources

**Metra GTFS Documentation:**
- Static feed: https://schedules.metrarail.com/gtfs/schedule.zip
- Published timestamp: https://schedules.metrarail.com/gtfs/published.txt
- Realtime feeds: https://gtfspublic.metrarr.com/gtfs/public/*
- API key request: [Insert link when available]

**GTFS Specifications:**
- GTFS Static: https://gtfs.org/schedule/reference/
- GTFS Realtime: https://gtfs.org/realtime/reference/

**Libraries:**
- gtfs-realtime-bindings: https://github.com/google/gtfs-realtime-bindings
- adm-zip: https://github.com/cthackers/adm-zip
- csv-parse: https://csv.js.org/parse/

---

## Appendix A: CSV Parsing Example

```typescript
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const parseGTFSFile = <T>(filePath: string): T[] => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true, // Use first row as headers
    skip_empty_lines: true,
    trim: true,
    cast: (value, context) => {
      // Convert empty strings to null
      if (value === '') return null;
      // Convert numeric strings to numbers for specific columns
      if (context.column === 'stop_lat' || context.column === 'stop_lon') {
        return parseFloat(value);
      }
      return value;
    }
  });

  return records as T[];
};
```

---

## Appendix B: GTFS-RT Entity Extraction

```typescript
// Alert entity structure
interface Alert {
  activePeriod: Array<{ start: number; end: number }>;
  informedEntity: Array<{ routeId?: string; stopId?: string }>;
  cause: number;
  effect: number;
  url: { translation: Array<{ text: string }> };
  headerText: { translation: Array<{ text: string }> };
  descriptionText: { translation: Array<{ text: string }> };
}

// Trip update entity structure
interface TripUpdate {
  trip: { tripId: string; routeId: string };
  stopTimeUpdate: Array<{
    stopSequence: number;
    stopId: string;
    arrival: { delay: number; time: number };
    departure: { delay: number; time: number };
  }>;
}

// Vehicle position entity structure
interface VehiclePosition {
  trip: { tripId: string; routeId: string };
  position: { latitude: number; longitude: number; bearing: number };
  currentStopSequence: number;
  currentStatus: number; // STOPPED_AT, IN_TRANSIT_TO, etc.
  timestamp: number;
  vehicle: { id: string; label: string };
}
```

---

**END OF MIGRATION PLAN**
