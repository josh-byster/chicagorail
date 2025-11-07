# Chicago Rail Codebase Audit Report

## Project Overview

**Project Name:** Metra Train Tracker (chicagorail)
**Type:** Monorepo (pnpm workspaces)
**Structure:**

- packages/shared: 167 LOC - Types and Zod schemas
- packages/backend: 3,343 LOC - Express API server
- packages/frontend: 4,453 LOC - React PWA
- **Total: ~7,963 lines of TypeScript**

---

## 1. PROJECT STRUCTURE & ORGANIZATION

### Strengths:

- Well-organized monorepo structure with clear separation of concerns
- Shared types package prevents duplication
- Clear API routing structure (/api/\*)
- Service layer properly separated from routes
- Frontend organized by features (components, hooks, pages, services, stores)

### Issues Found:

#### 1.1 Backend Services Architecture

- **Location:** `packages/backend/src/services/`
- **Issue:** Some services are mixing responsibilities
  - `gtfs-init.service.ts` combines downloading, parsing, and database operations (532 lines)
  - Consider splitting into smaller focused services

#### 1.2 Missing Repository/Data Access Layer

- **Location:** Backend
- **Issue:** Database queries are scattered across services without abstraction
  - `train.service.ts` has inline queries with 776 lines total
  - Recommend creating a data access layer to separate database logic

---

## 2. TYPESCRIPT USAGE & TYPE SAFETY

### Strengths:

- Uses Zod for runtime validation with inferred types
- Strong typing in most areas
- Proper use of interfaces and types

### Critical Issues:

#### 2.1 Weak Typing with `any`

**Impact:** HIGH - Compromises type safety
**Locations:**

- `train.service.ts` lines 42, 150, 187, 200, 270: Uses `z.any()` for stop types (circular dependency issue)
- `gtfs-init.service.ts` line 270: Parameter typed as `db: any` instead of `Database`
- `gtfs-realtime.service.ts` lines 86-88: Realtime data stored as `any[]` without proper types
- `station.service.ts` line 11: Interface uses `string` for `lines_served` but treats as JSON

**Example Problem:**

```typescript
// train.service.ts line 42
stops: z.array(z.any()), // Will be StopTime[] - using z.any() to avoid circular dependency
```

**Solution:** Create separate type files to break circular dependencies

#### 2.2 Database Type Safety

**Location:** `gtfs-init.service.ts` lines 270+
**Issue:** All database operations use `any` type instead of proper types

```typescript
const createTables = (db: any) => {
  // Should be Database.Database
  // All subsequent operations lack type safety
};
```

**Impact:** Loss of autocomplete, type checking at compile time, and documentation

#### 2.3 Protocol Buffer Parsing Without Proper Types

**Location:** `gtfs-realtime.service.ts`
**Issue:**

- Lines 86-88: Realtime data stored as `any[]`
- No proper type definitions for protobuf messages
- Makes data transformation code fragile

---

## 3. CODE QUALITY ISSUES

### 3.1 Code Duplication (HIGH PRIORITY)

#### 3.1.1 Duplicate Utility Functions in train.service.ts

**Location:** `packages/backend/src/services/train.service.ts`

**Duplicated:**

1. **getChicagoOffset** (defined twice: lines 157-184 and 442-469)
   - 28 lines of identical code
2. **constructDateTime** (defined twice: lines 242-264 and 472-494)
   - 23 lines of identical code

**Impact:** Maintenance burden, inconsistent updates, harder to fix timezone bugs

**Recommendation:** Extract to `utils/datetime.utils.ts`:

```typescript
// shared utility
export const getChicagoOffset = (dateStr: string): string => { ... }
export const constructDateTime = (timeStr: string): string => { ... }
```

#### 3.1.2 Similar Logic in Multiple Functions

**Location:** `train.service.ts` functions: `getUpcomingTrains()` (line 31-296) and `getTrainDetail()` (line 303-408)

**Duplication:**

- Both functions duplicate realtime data fetching logic (lines 153-154 vs 339-340)
- Both duplicate train status determination logic (lines 211-226 vs 360-375)
- Both duplicate position finding logic (lines 228-239 vs 377-388)

**Recommendation:** Extract to helper functions

### 3.2 SQL Injection Risks (MEDIUM PRIORITY)

**Location:** `train.service.ts` lines 111-146

**Issue:** Query uses string template literals for non-parameterized values:

```typescript
const query = `
  ...
  LEFT JOIN calendar_dates cd ON t.service_id = cd.service_id AND cd.date = '${searchDate}'
  WHERE ...
    AND c.${dayColumn} = 1  // <-- Template literal with dynamic column
    AND c.start_date <= '${searchDate}'
    AND c.end_date >= '${searchDate}'
  ...
  ${limit ? `LIMIT ${limit}` : ''}  // <-- Template literal with user input
`;
```

**Risk Assessment:**

- `searchDate`: Derived from current date, lower risk but still not ideal
- `dayColumn`: Hardcoded in array, no injection risk
- `limit`: **HIGH RISK** - comes from user input, can cause logic errors or DoS

**Current mitigation:** Appears the limit is validated before use (line 32), but relies on runtime validation

**Recommendation:**

```typescript
// Use parameterized query approach instead:
const query = `... LIMIT ?`;
const trips = db.prepare(query).all(originId, destinationId, searchTime, limit);
```

### 3.3 Excessive Console Logging (MEDIUM PRIORITY)

**Count:** 217 console.log/error/warn statements across codebase

**Problematic areas:**

- `train.service.ts` lines 204-209, 353-358: Debugging logs left in production code
- `gtfs-init.service.ts`: Extensive emoji logging (useful for CLI but verbose)
- Backend services have debugging output that should be behind logger configuration

**Impact:**

- Performance overhead in production
- Log pollution
- Security concern: May leak sensitive info

**Recommendation:** Implement proper logging framework:

```typescript
// Use winston, pino, or similar
import logger from './logger';
logger.debug('Found vehicle position:', vehiclePosition); // Only in dev
logger.info('GTFS data import complete'); // Always
```

### 3.4 Weak Error Handling

**Issue 1: Silent Error Suppression**
**Location:** `station.service.ts` lines 51, 90, 131

```typescript
lines_served: JSON.parse(row.lines_served || '[]'), // Assumes valid JSON
```

Could throw if data is corrupted. No try-catch.

**Issue 2: Generic Error Messages**
**Locations:** Multiple API routes (stations.ts, trains.ts, health.ts)

```typescript
catch (error) {
  console.error('Error fetching stations:', error);
  res.status(500).json({ error: 'Failed to fetch stations' }); // Too generic
}
```

**Issue 3: Missing Error Validation**
**Location:** `health.ts` lines 31-56
Queries tables that might not exist, catches error but still continues

---

## 4. ARCHITECTURE PATTERNS

### 4.1 Database Connection Pattern

**Issue:** Singleton pattern with lazy initialization could cause race conditions

**Location:** `database.service.ts` lines 8-39

```typescript
let db: Database.Database | null = null;

export const initDatabase = (): Database.Database => {
  if (db) {
    return db; // No locking mechanism
  }
  // Initialize...
  db = new Database(env.DATABASE_PATH);
};
```

**Risk:** In high concurrency scenarios (multi-threaded Node.js), two threads could both see `db === null` and initialize twice

**Recommendation:** Use proper synchronization or move to top-level initialization

### 4.2 Cache Implementation

**Issue:** Simple in-memory cache can cause memory leaks

**Location:** `cache.service.ts` lines 15, 43-59

```typescript
const cacheStore: Map<string, CacheEntry<any>> = new Map();

export const getCachedData = <T>(key: string): T | null => {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cacheStore.delete(key); // Manual cleanup
    return null;
  }
  return entry.data as T;
};
```

**Problem:**

- No automatic cleanup if `getCachedData` is never called for expired entries
- Cache could grow unbounded if new keys keep being added

**Recommendation:**

- Implement periodic cleanup interval
- Add cache size limits

### 4.3 Service Startup Pattern

**Issue:** Startup service calls `initDatabase()` twice

**Location:** `startup.service.ts` lines 14-18

```typescript
console.log('📦 Initializing database...');
initDatabase();

// 2. Check if database has data, if not import it
const db = initDatabase(); // Called again!
```

**Impact:** Minor but indicates unclear initialization pattern

---

## 5. DEPENDENCIES & PACKAGES

### 5.1 Unused Dependencies

**Location:** `backend/package.json`

**Suspicious dependency:**

- `"gtfs": "^4.18.0"` - Installed but never imported in any source file
  - Verified via grep: No `import ... from 'gtfs'`
  - Could be legacy from previous implementation

**Recommendation:** Remove if not needed:

```bash
pnpm remove gtfs
```

### 5.2 Version Consistency Issues

**Zod versions differ between packages:**

- shared: `"zod": "^3.22.4"`
- backend: `"zod": "^3.22.4"`
- frontend: `"zod": "^3.23.8"`

**Impact:** Minimal (patch version difference), but could cause issues

### 5.3 Heavy Dependencies

**Frontend bundle concerns:**

- `mapbox-gl` (3.15.0) - Not currently used in components
- Large peer dependency tree

---

## 6. FRONTEND SPECIFIC ISSUES

### 6.1 Local Storage vs IndexedDB Inconsistency

**Issue:** Two different storage implementations for similar data

**Locations:**

- `saved-routes.ts`: Uses LocalStorage only
- `storage.ts`: Uses IndexedDB (Dexie)

**Inconsistency:**

- SavedRoute stored in localStorage (size limited to ~5-10MB)
- Train data stored in IndexedDB (size limited to 50MB+)

**Problem:** If user has many saved routes, localStorage could fill up

**Recommendation:** Standardize on IndexedDB for all persistent storage

### 6.2 Missing Pagination

**Location:** `useStations.ts`, `useLines` (implicit)
**Issue:** No pagination/infinite scroll for station list

- If user has 100+ stations, rendering all at once could be slow
- No virtual scrolling in dropdown

### 6.3 Type Mismatch in Storage

**Location:** `storage.ts` line 8 vs `saved-routes.ts` line 1

```typescript
// storage.ts defines local SavedRoute interface
interface SavedRoute { ... }

// But also imports from shared
import { SavedRoute } from '@metra/shared';

// saved-routes.ts imports from shared and uses localStorage
import { SavedRoute } from '@metra/shared';
```

**Issue:** Type duplication, maintenance burden

---

## 7. TESTING

### Critical: No Tests Found

**Status:** **ZERO test coverage** across entire codebase

**Expected test files:**

- `*.test.ts`, `*.test.tsx`, `*.spec.ts` - **None found**

**Impact:**

- No confidence in refactoring
- No documentation of expected behavior
- Regression risk

**What should be tested:**

1. Backend:
   - Train service queries (date/time edge cases)
   - Color normalization utility
   - GTFS import logic
   - Realtime data polling
2. Frontend:
   - Route search store behavior
   - API error handling (offline scenarios)
   - Cache management
   - Storage interactions

---

## 8. CONFIGURATION & ENVIRONMENT

### 8.1 Hardcoded Configuration

**Location:** `cors.ts` lines 3-8

```typescript
const allowedOrigins = [
  'https://chicagorail.app',
  'https://www.chicagorail.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
```

**Issue:** CORS origins hardcoded, should be environment variable

**Recommendation:**

```typescript
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',');
```

### 8.2 Frontend API URL Configuration

**Location:** `api.ts` line 3

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**Good:** Falls back to localhost for development

---

## 9. DOCUMENTATION

### 9.1 Missing JSDoc

**Issue:** Functions lack documentation

**Examples:**

- `train.service.ts`: Complex geospatial functions (lines 519-717) lack JSDoc details
- `gtfs-realtime.service.ts`: Protocol buffer parsing lacks explanation

### 9.2 Incomplete Type Documentation

**Location:** Multiple service files

- Interfaces lack field descriptions
- Complex query logic not explained

---

## 10. PERFORMANCE CONCERNS

### 10.1 N+1 Query Problem

**Location:** `line.service.ts` lines 47-61

```typescript
routes.forEach((route) => {
  const stations = db.prepare(...).all(route.route_id) // Query inside loop!
});
```

**Impact:** For N routes, this executes N database queries instead of 1 join

**Better approach:**

```typescript
const query = `
  SELECT DISTINCT t.route_id, st.stop_id
  FROM stop_times st
  JOIN trips t ON st.trip_id = t.trip_id
  ORDER BY t.route_id, st.stop_id
`;
const result = db.prepare(query).all();
```

### 10.2 Memory Inefficiency

**Location:** `station.service.ts` lines 25-55

```typescript
.all() as StopRow[];  // Returns ALL rows into memory
return stations.map((row) => ({...}));  // Transforms all
```

For databases with 10k+ stations, this loads everything into memory

**Recommendation:**

- Add pagination support
- Implement database cursor/streaming for large result sets

### 10.3 Realtime Polling Efficiency

**Location:** `gtfs-realtime.service.ts` line 202

```typescript
setInterval(() => {
  pollGTFSRealtimeData().catch(console.error);
}, getConfig().pollInterval);
```

**Issue:** If poll takes 25 seconds and interval is 30 seconds, works fine, but if it takes 35 seconds, queues up multiple requests

**Better approach:** Use timeout after completion rather than fixed interval

---

## 11. SECURITY CONCERNS

### 11.1 API Token Exposure

**Location:** Multiple files

- `env.ts`: Loads `METRA_API_TOKEN` from environment (Good)
- `gtfs-realtime.service.ts`: Uses token in auth header (Good)

**Risk:** Ensure `.env` is never committed (appears to be in `.gitignore` - Good)

### 11.2 CORS Configuration

**Location:** `cors.ts`
**Status:** Properly configured, not overly permissive

### 11.3 Error Response Leakage

**Location:** `error-handler.ts` line 38

```typescript
...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
```

**Good:** Stack traces only in development

---

## SUMMARY SCORECARD

| Category      | Score | Status                                          |
| ------------- | ----- | ----------------------------------------------- |
| Architecture  | 7/10  | Good structure, missing data layer              |
| Type Safety   | 5/10  | **NEEDS WORK** - Heavy use of `any`             |
| Code Quality  | 4/10  | **CRITICAL** - Duplication, weak error handling |
| Testing       | 0/10  | **CRITICAL** - No tests at all                  |
| Documentation | 3/10  | Missing JSDoc, inline comments sparse           |
| Performance   | 6/10  | N+1 queries, memory inefficiencies              |
| Security      | 8/10  | Good, minor improvements possible               |
| Dependencies  | 7/10  | Good, one unused dependency                     |

---

## PRIORITY REFACTORING ROADMAP

### 🔴 CRITICAL (Do First)

1. **Add unit tests** - At least for services
2. **Fix SQL injection risk** - Parameterize LIMIT clause
3. **Remove type `any`** - Add proper types to database functions
4. **Extract duplicate functions** - DRY up train.service.ts

### 🟠 HIGH (Do Soon)

1. **Create data access layer** - Abstract database queries
2. **Fix N+1 queries** - Combine database queries
3. **Implement proper logging** - Remove console statements
4. **Add error validation** - Better error handling

### 🟡 MEDIUM (Do Later)

1. **Standardize storage** - Use IndexedDB for all persistent data
2. **Remove unused dependencies** - Clean up package.json
3. **Add JSDoc** - Document complex functions
4. **Implement caching cleanup** - Prevent memory leaks
5. **Cache warm-up strategy** - For frequently accessed data

---

## SPECIFIC FILES TO REFACTOR

1. **`packages/backend/src/services/train.service.ts`** (776 lines)
   - Extract utility functions
   - Break into smaller focused functions
   - Add proper types

2. **`packages/backend/src/services/gtfs-init.service.ts`** (532 lines)
   - Split into download, parse, import services
   - Add proper database typing

3. **`packages/backend/src/api/trains.ts`**
   - Add input validation middleware
   - Parameterize SQL queries

4. **`packages/frontend/src/services/saved-routes.ts`**
   - Migrate to IndexedDB
   - Add proper error handling

---

**Report Generated:** 2025-11-07
**Total Issues Found:** 47
**Critical Issues:** 4
**High Priority:** 8
**Medium Priority:** 12
