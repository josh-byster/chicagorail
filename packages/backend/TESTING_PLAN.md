# Comprehensive Backend Regression Testing Plan

## Overview

Based on my analysis, here's an **exhaustive regression testing strategy** for the Metra backend that covers:

- ✅ Unit tests for all services
- ✅ Integration tests for API endpoints with database interactions
- ✅ Data validation tests using sample fixtures
- ✅ Realtime data merging tests
- ✅ Complex query/join correctness tests
- ✅ Performance/load tests
- ✅ Error handling and edge cases

---

## 1. Test Infrastructure Setup

### Test Database Strategy

```
├── tests/
│   ├── setup/
│   │   ├── test-db.ts              # Test database initialization
│   │   ├── seed-from-samples.ts    # Load sample data into test DB
│   │   └── cleanup.ts              # Teardown utilities
│   ├── fixtures/
│   │   └── index.ts                # Import all sample JSONs as fixtures
│   ├── helpers/
│   │   ├── request.ts              # Supertest wrapper
│   │   └── matchers.ts             # Custom Vitest matchers
│   └── ...test files...
```

**Key Decisions**:

- **Separate test database**: Create `test.db` in memory or temp directory
- **Seed from samples**: Use your existing `samples/*.json` files as fixtures
- **Fresh DB per test suite**: Reset between test files for isolation
- **Shared DB within suite**: For performance, reset only between suites

---

## 2. Test Categories & Structure

### **A. Unit Tests** (Pure Logic - No DB/Network)

#### `tests/unit/utils/color.utils.test.ts`

- ✅ Test `normalizeHexColor()` with/without `#` prefix
- ✅ Test invalid hex codes

#### `tests/unit/services/cache.service.test.ts`

- ✅ Test TTL expiration
- ✅ Test cache hit/miss
- ✅ Test cache invalidation

#### `tests/unit/services/alert.service.test.ts`

- ✅ Test alert filtering by line_id
- ✅ Test alert filtering by station_id
- ✅ Test alert schema validation from realtime data

#### `tests/unit/services/train.service.test.ts` (geospatial functions)

- ✅ Test `calculateHaversineDistance()` with known coordinates
- ✅ Test `calculateBearing()` with known coordinates
- ✅ Test `findCurrentStation()` with mock position data
- ✅ Test `findCurrentStationEnhanced()` with bearing logic

---

### **B. Integration Tests** (Database + Service Layer)

Create a **test database seeded from your sample data** for these tests.

#### `tests/integration/services/station.service.test.ts`

```typescript
describe('Station Service Integration', () => {
  beforeAll(async () => {
    // Initialize test DB and seed from samples
    await initTestDatabase();
    await seedFromSamples();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('getAllStations', () => {
    it('should return all stations from sample data', async () => {
      const stations = await getAllStations();
      const sampleStops = await import(
        '../../samples/gtfs_schedule_stops.json'
      );

      expect(stations).toHaveLength(sampleStops.length);
      // Validate schema for each station
      stations.forEach((station) => {
        expect(() => StationSchema.parse(station)).not.toThrow();
      });
    });
  });

  describe('getStationsByLine', () => {
    it('should return only UP-N line stations', async () => {
      const stations = await getStationsByLine('UP-N');

      stations.forEach((station) => {
        expect(station.lines_served).toContain('UP-N');
      });
    });

    it('should return empty array for invalid line', async () => {
      const stations = await getStationsByLine('INVALID');
      expect(stations).toEqual([]);
    });
  });

  describe('getReachableStations', () => {
    it('should find all destinations reachable from Chicago Union Station', async () => {
      const reachable = await getReachableStations('CUS');

      // CUS should be able to reach all other stations on served lines
      expect(reachable.length).toBeGreaterThan(0);

      // Validate no duplicates
      const ids = reachable.map((s) => s.stop_id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should return empty array for non-existent origin', async () => {
      const reachable = await getReachableStations('FAKE_STATION');
      expect(reachable).toEqual([]);
    });
  });
});
```

#### `tests/integration/services/line.service.test.ts`

```typescript
describe('Line Service Integration', () => {
  it('should return all 11 Metra lines', async () => {
    const lines = await getAllLines();
    const sampleRoutes = await import(
      '../../samples/gtfs_schedule_routes.json'
    );

    expect(lines).toHaveLength(sampleRoutes.length);
  });

  it('should return line with all stations in correct order', async () => {
    const line = await getLineById('UP-N');

    expect(line).toBeDefined();
    expect(line?.route_id).toBe('UP-N');
    expect(line?.stations.length).toBeGreaterThan(0);

    // Validate stations have required fields
    line?.stations.forEach((station) => {
      expect(station).toHaveProperty('stop_id');
      expect(station).toHaveProperty('stop_name');
      expect(station.lines_served).toContain('UP-N');
    });
  });

  it('should normalize route colors', async () => {
    const lines = await getAllLines();

    lines.forEach((line) => {
      expect(line.route_color).toMatch(/^#[0-9A-F]{6}$/);
      expect(line.route_text_color).toMatch(/^#[0-9A-F]{6}$/);
    });
  });
});
```

#### `tests/integration/services/train.service.test.ts` (CRITICAL - Complex Joins)

```typescript
describe('Train Service Integration', () => {
  describe('getUpcomingTrains', () => {
    it('should return trains from CUS to OTC on a weekday', async () => {
      // Use a known date from your sample data
      const trains = await getUpcomingTrains(
        'CUS',
        'OTC',
        10,
        '08:00:00',
        '2025-01-15'
      );

      expect(trains.length).toBeGreaterThan(0);

      trains.forEach((train) => {
        // Validate schema
        expect(() => TrainSchema.parse(train)).not.toThrow();

        // Validate origin/destination
        expect(train.origin.stop_id).toBe('CUS');
        expect(train.destination.stop_id).toBe('OTC');

        // Validate departure before arrival
        expect(
          new Date(train.departure_time) < new Date(train.arrival_time)
        ).toBe(true);
      });
    });

    it('should handle trains after midnight (GTFS times > 24:00)', async () => {
      // Test edge case where GTFS allows times like "25:30:00"
      const trains = await getUpcomingTrains(
        'CUS',
        'OTC',
        10,
        '23:00:00',
        '2025-01-15'
      );

      // Should include trains that depart after midnight
      const afterMidnight = trains.filter((t) => {
        const time = new Date(t.departure_time);
        return time.getHours() < 3; // Trains between midnight and 3am
      });

      // Validate times are properly converted
      afterMidnight.forEach((train) => {
        expect(train.departure_time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });

    it('should respect calendar exceptions', async () => {
      // Load calendar_dates sample to find an exception
      const calendarDates = await import(
        '../../samples/gtfs_schedule_calendar_dates.json'
      );
      const exception = calendarDates.find((d) => d.exception_type === 2); // Service removed

      if (exception) {
        const trains = await getUpcomingTrains(
          'CUS',
          'OTC',
          100,
          '08:00:00',
          exception.date
        );

        // Should filter out trips that are normally scheduled on this date
        const affectedTrip = trains.find(
          (t) => t.service_id === exception.service_id
        );
        expect(affectedTrip).toBeUndefined();
      }
    });

    it('should merge realtime delay data', async () => {
      // Mock realtime trip updates
      const mockTripUpdates = {
        entity: [
          {
            id: '1',
            trip_update: {
              trip: { trip_id: 'TRIP_123' },
              stop_time_update: [
                {
                  stop_id: 'CUS',
                  departure: { delay: 300 }, // 5 minutes
                },
              ],
            },
          },
        ],
      };

      // Test that delays are properly applied
      // (You'll need to inject mock realtime data here)
    });

    it('should merge realtime vehicle positions', async () => {
      // Test that train positions are correctly merged
      // Validate geospatial calculations
    });

    it('should return empty array when no service exists', async () => {
      const trains = await getUpcomingTrains(
        'CUS',
        'OTC',
        10,
        '03:00:00',
        '2025-01-15'
      );
      // Early morning should have fewer/no trains
      expect(Array.isArray(trains)).toBe(true);
    });

    it('should enforce limit parameter', async () => {
      const trains = await getUpcomingTrains(
        'CUS',
        'OTC',
        3,
        '08:00:00',
        '2025-01-15'
      );
      expect(trains.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getTrainDetail', () => {
    it('should return complete trip with all stops', async () => {
      // Get a trip_id from sample data
      const trips = await import('../../samples/gtfs_schedule_trips.json');
      const tripId = trips[0].trip_id;

      const train = await getTrainDetail(tripId);

      expect(train).toBeDefined();
      expect(train?.stops.length).toBeGreaterThan(0);

      // Validate stops are in sequence order
      for (let i = 0; i < train!.stops.length - 1; i++) {
        expect(
          train!.stops[i].stop_sequence < train!.stops[i + 1].stop_sequence
        ).toBe(true);
      }
    });

    it('should return null for invalid trip_id', async () => {
      const train = await getTrainDetail('INVALID_TRIP');
      expect(train).toBeNull();
    });
  });

  describe('getStopsForTrip', () => {
    it('should return stops with proper datetime formatting', async () => {
      const trips = await import('../../samples/gtfs_schedule_trips.json');
      const tripId = trips[0].trip_id;

      const stops = await getStopsForTrip(tripId, '2025-01-15');

      stops.forEach((stop) => {
        expect(stop.arrival_time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(stop.departure_time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });
});
```

---

### **C. API Endpoint Tests** (Full HTTP Integration)

#### `tests/e2e/api/stations.test.ts`

```typescript
import request from 'supertest';
import app from '../../../src/server';

describe('Stations API', () => {
  beforeAll(async () => {
    await initTestDatabase();
    await seedFromSamples();
  });

  describe('GET /api/stations', () => {
    it('should return 200 with all stations', async () => {
      const res = await request(app).get('/api/stations');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter by line_id query param', async () => {
      const res = await request(app).get('/api/stations?line_id=UP-N');

      expect(res.status).toBe(200);
      res.body.forEach((station) => {
        expect(station.lines_served).toContain('UP-N');
      });
    });

    it('should handle invalid line_id gracefully', async () => {
      const res = await request(app).get('/api/stations?line_id=INVALID');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/stations/:stationId', () => {
    it('should return 200 with single station', async () => {
      const res = await request(app).get('/api/stations/CUS');

      expect(res.status).toBe(200);
      expect(res.body.stop_id).toBe('CUS');
      expect(res.body.stop_name).toBe('Chicago Union Station');
    });

    it('should return 404 for non-existent station', async () => {
      const res = await request(app).get('/api/stations/FAKE');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/stations/:stationId/reachable', () => {
    it('should return 200 with reachable stations', async () => {
      const res = await request(app).get('/api/stations/CUS/reachable');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent station', async () => {
      const res = await request(app).get('/api/stations/FAKE/reachable');

      expect(res.status).toBe(404);
    });
  });
});
```

#### `tests/e2e/api/trains.test.ts`

```typescript
describe('Trains API', () => {
  describe('GET /api/trains', () => {
    it('should return 400 when origin is missing', async () => {
      const res = await request(app).get('/api/trains?destination=OTC');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('origin');
    });

    it('should return 400 when destination is missing', async () => {
      const res = await request(app).get('/api/trains?origin=CUS');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('destination');
    });

    it('should return 200 with trains array', async () => {
      const res = await request(app).get(
        '/api/trains?origin=CUS&destination=OTC&date=2025-01-15&time=08:00:00'
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app).get(
        '/api/trains?origin=CUS&destination=OTC&limit=5'
      );

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(5);
    });

    it('should use current time when time param omitted', async () => {
      const res = await request(app).get(
        '/api/trains?origin=CUS&destination=OTC'
      );

      expect(res.status).toBe(200);
      // Validate that returned trains are in the future
    });

    it('should validate date format', async () => {
      const res = await request(app).get(
        '/api/trains?origin=CUS&destination=OTC&date=invalid'
      );

      // Should either use default or return 400
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('GET /api/trains/:tripId', () => {
    it('should return 200 with train detail', async () => {
      const trips = await import('../../samples/gtfs_schedule_trips.json');
      const tripId = trips[0].trip_id;

      const res = await request(app).get(`/api/trains/${tripId}`);

      expect(res.status).toBe(200);
      expect(res.body.trip_id).toBe(tripId);
      expect(Array.isArray(res.body.stops)).toBe(true);
    });

    it('should return 404 for invalid trip_id', async () => {
      const res = await request(app).get('/api/trains/INVALID');

      expect(res.status).toBe(404);
    });
  });
});
```

#### `tests/e2e/api/lines.test.ts`

```typescript
describe('Lines API', () => {
  describe('GET /api/lines', () => {
    it('should return 200 with all lines', async () => {
      const res = await request(app).get('/api/lines');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(11); // All Metra lines
    });

    it('should include stations for each line', async () => {
      const res = await request(app).get('/api/lines');

      res.body.forEach((line) => {
        expect(line.stations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/lines/:lineId', () => {
    it('should return 200 with line detail', async () => {
      const res = await request(app).get('/api/lines/UP-N');

      expect(res.status).toBe(200);
      expect(res.body.route_id).toBe('UP-N');
      expect(Array.isArray(res.body.stations)).toBe(true);
    });

    it('should return 404 for invalid line', async () => {
      const res = await request(app).get('/api/lines/INVALID');

      expect(res.status).toBe(404);
    });
  });
});
```

#### `tests/e2e/api/alerts.test.ts`

```typescript
describe('Alerts API', () => {
  describe('GET /api/alerts', () => {
    it('should return 200 with alerts array', async () => {
      const res = await request(app).get('/api/alerts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by line_id', async () => {
      const res = await request(app).get('/api/alerts?line_id=UP-N');

      expect(res.status).toBe(200);
      // Validate filtering logic
    });

    it('should filter by station_id', async () => {
      const res = await request(app).get('/api/alerts?station_id=CUS');

      expect(res.status).toBe(200);
      // Validate filtering logic
    });
  });
});
```

#### `tests/e2e/api/health.test.ts`

```typescript
describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('gtfs_last_updated');
      expect(res.body).toHaveProperty('environment');
    });

    it('should include GTFS version info', async () => {
      const res = await request(app).get('/api/health');

      expect(res.body.gtfs_static_version).toBeDefined();
    });
  });
});
```

---

### **D. Data Validation Tests**

#### `tests/validation/sample-data.test.ts`

```typescript
describe('Sample Data Validation', () => {
  it('should validate agency sample against schema', async () => {
    const agency = await import('../samples/gtfs_schedule_agency.json');

    agency.forEach((item) => {
      expect(() => {
        // Define or import GTFS agency schema
        z.object({
          agency_id: z.string(),
          agency_name: z.string(),
          agency_url: z.string().url(),
          agency_timezone: z.string(),
          agency_lang: z.string(),
          agency_phone: z.string(),
          agency_fare_url: z.string().url(),
        }).parse(item);
      }).not.toThrow();
    });
  });

  it('should validate routes sample', async () => {
    const routes = await import('../samples/gtfs_schedule_routes.json');

    expect(routes.length).toBe(11); // All Metra lines
    routes.forEach((route) => {
      expect(route.route_id).toBeDefined();
      expect(route.route_short_name).toBeDefined();
    });
  });

  it('should validate stops sample', async () => {
    const stops = await import('../samples/gtfs_schedule_stops.json');

    stops.forEach((stop) => {
      expect(stop.stop_id).toBeDefined();
      expect(stop.stop_lat).toBeTypeOf('number');
      expect(stop.stop_lon).toBeTypeOf('number');
    });
  });

  it('should validate stop_times sample has valid references', async () => {
    const stopTimes = await import('../samples/gtfs_schedule_stop_times.json');
    const trips = await import('../samples/gtfs_schedule_trips.json');
    const stops = await import('../samples/gtfs_schedule_stops.json');

    const tripIds = new Set(trips.map((t) => t.trip_id));
    const stopIds = new Set(stops.map((s) => s.stop_id));

    // Validate foreign key integrity
    stopTimes.forEach((st) => {
      expect(tripIds.has(st.trip_id)).toBe(true);
      expect(stopIds.has(st.stop_id)).toBe(true);
    });
  });

  it('should validate realtime alerts schema', async () => {
    const alerts = await import('../samples/gtfs_realtime_alerts.json');

    // Validate GTFS-RT alert structure
    expect(alerts).toHaveProperty('header');
    expect(alerts).toHaveProperty('entity');
  });
});
```

---

### **E. Regression Tests** (Compare Output vs Known Good State)

#### `tests/regression/endpoint-snapshots.test.ts`

```typescript
describe('Endpoint Output Regression', () => {
  it('should match snapshot for GET /api/stations', async () => {
    const res = await request(app).get('/api/stations');

    // Use Vitest snapshot testing
    expect(res.body).toMatchSnapshot();
  });

  it('should match snapshot for GET /api/lines', async () => {
    const res = await request(app).get('/api/lines');
    expect(res.body).toMatchSnapshot();
  });

  it('should match snapshot for GET /api/trains with fixed date', async () => {
    const res = await request(app).get(
      '/api/trains?origin=CUS&destination=OTC&date=2025-01-15&time=08:00:00'
    );

    // Snapshot should be stable for fixed date/time
    expect(res.body).toMatchSnapshot();
  });
});
```

---

### **F. Performance & Load Tests**

#### `tests/performance/query-performance.test.ts`

```typescript
describe('Query Performance', () => {
  it('should handle GET /api/trains in <200ms', async () => {
    const start = Date.now();

    await request(app).get('/api/trains?origin=CUS&destination=OTC');

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });

  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100)
      .fill(null)
      .map(() => request(app).get('/api/trains?origin=CUS&destination=OTC'));

    const results = await Promise.all(requests);

    results.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  it('should use cache for repeated queries', async () => {
    // First request (cache miss)
    const start1 = Date.now();
    await request(app).get('/api/trains?origin=CUS&destination=OTC');
    const duration1 = Date.now() - start1;

    // Second request (cache hit)
    const start2 = Date.now();
    await request(app).get('/api/trains?origin=CUS&destination=OTC');
    const duration2 = Date.now() - start2;

    // Cache hit should be significantly faster
    expect(duration2).toBeLessThan(duration1 * 0.5);
  });
});
```

---

### **G. Error Handling & Edge Cases**

#### `tests/error-handling/middleware.test.ts`

```typescript
describe('Error Handling Middleware', () => {
  it('should return 400 for Zod validation errors', async () => {
    // Trigger a validation error
    const res = await request(app).get('/api/trains'); // Missing required params

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 500 for database errors', async () => {
    // Mock database failure
    // (You'll need dependency injection or mocking here)
  });

  it('should handle CORS properly', async () => {
    const res = await request(app)
      .get('/api/stations')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
```

---

## 3. Test Organization Summary

```
packages/backend/tests/
├── setup/
│   ├── test-db.ts                    # Test database initialization
│   ├── seed-from-samples.ts          # Load samples/*.json into test DB
│   └── cleanup.ts                    # Teardown utilities
├── fixtures/
│   └── index.ts                      # Re-export all sample JSONs
├── helpers/
│   ├── request.ts                    # Supertest wrapper with auth
│   └── matchers.ts                   # Custom Vitest matchers
├── unit/
│   ├── utils/
│   │   └── color.utils.test.ts
│   └── services/
│       ├── cache.service.test.ts
│       ├── alert.service.test.ts     # Pure logic (no DB)
│       └── train.service.test.ts     # Geospatial functions
├── integration/
│   └── services/
│       ├── station.service.test.ts   # With test DB
│       ├── line.service.test.ts
│       └── train.service.test.ts     # Complex joins
├── e2e/
│   └── api/
│       ├── stations.test.ts          # Full HTTP tests
│       ├── trains.test.ts
│       ├── lines.test.ts
│       ├── alerts.test.ts
│       └── health.test.ts
├── validation/
│   └── sample-data.test.ts           # Validate sample JSONs
├── regression/
│   └── endpoint-snapshots.test.ts    # Snapshot testing
├── performance/
│   └── query-performance.test.ts     # Load & latency tests
└── error-handling/
    └── middleware.test.ts            # Error cases
```

---

## 4. Test Execution Strategy

### Commands

```bash
# Run all tests
pnpm test

# Run specific suite
pnpm test unit
pnpm test integration
pnpm test e2e

# Watch mode during development
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
- name: Unit Tests
  run: pnpm test unit

- name: Integration Tests
  run: pnpm test integration

- name: E2E Tests
  run: pnpm test e2e

- name: Coverage Report
  run: pnpm test:coverage
  # Enforce >80% coverage
```

---

## 5. Coverage Goals

| Category       | Target Coverage |
| -------------- | --------------- |
| **Services**   | 95%+            |
| **Routes**     | 90%+            |
| **Middleware** | 90%+            |
| **Utils**      | 100%            |
| **Overall**    | 85%+            |

---

## 6. Critical Test Scenarios (Must-Have)

✅ **Calendar & Service Exceptions**

- Test trains on weekdays vs weekends
- Test calendar exceptions (holidays, service changes)
- Test times crossing midnight (25:30:00 format)

✅ **Complex Joins**

- Validate `getUpcomingTrains` returns correct trips
- Validate stop sequence ordering
- Validate trip → route → stops joins are correct

✅ **Realtime Data Merging**

- Mock GTFS-RT alerts, trip updates, positions
- Validate delays are correctly applied
- Validate geospatial position calculations

✅ **Edge Cases**

- Empty results (no trains at 3am)
- Invalid station IDs
- Malformed query parameters
- Database connection failures

✅ **Data Integrity**

- Foreign key validation (trip_id, stop_id references)
- Schema validation for all responses
- Sample data matches expected structure

---

## 7. Recommended Testing Tools

Already installed:

- ✅ **Vitest** - Test runner
- ✅ **Supertest** - HTTP assertion library

Should add:

- **@vitest/coverage-v8** - Coverage reporting
- **msw** (Mock Service Worker) - Mock GTFS realtime API calls
- **testcontainers** (optional) - If you want to test against real SQLite in Docker

---

## 8. Implementation Priority

1. **Phase 1**: Test infrastructure (setup, fixtures, helpers)
2. **Phase 2**: Unit tests (pure functions, no DB)
3. **Phase 3**: Integration tests (services with test DB)
4. **Phase 4**: E2E API tests (full HTTP)
5. **Phase 5**: Regression & performance tests

---

## Next Steps

Implementation can proceed in the following order:

1. **Implement the test infrastructure** (test DB setup, seed utilities)
2. **Write specific test suites** (e.g., start with `train.service.test.ts`)
3. **Create a test configuration file** (vitest.config.ts)
4. **Set up CI/CD integration** for automated testing
