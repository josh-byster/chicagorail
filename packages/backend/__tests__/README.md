# Backend Test Suite

Comprehensive test suite for the Chicago Rail backend API, including unit tests and integration tests using real Metra GTFS data snapshots for regression testing.

## Overview

This test suite consists of:

1. **Unit Tests** - Test individual functions and methods in isolation
2. **Integration Tests** - Test full HTTP request/response cycles with real GTFS data
3. **GTFS Snapshots** - Real Metra GTFS data captured for regression testing

## Test Structure

```
__tests__/
├── fixtures/
│   ├── gtfs/                    # Real Metra GTFS data snapshot
│   │   ├── routes.txt
│   │   ├── stops.txt
│   │   ├── trips.txt
│   │   ├── stop_times.txt
│   │   ├── calendar.txt
│   │   └── metadata.json        # Snapshot metadata
│   └── schedule.zip             # Original GTFS ZIP file
├── setup/
│   └── testApp.ts               # Express app for integration testing
├── utils/
│   └── testHelpers.ts           # Test utilities and helpers
├── unit/
│   ├── gtfsService.test.ts      # GTFS service unit tests
│   ├── searchUtils.test.ts      # Search utility tests
│   └── timeUtils.test.ts        # Time utility tests
└── integration/
    ├── routes.test.ts           # Routes API integration tests
    ├── stops.test.ts            # Stops API integration tests
    └── health.test.ts           # Health check and API tests
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm test:unit
```

### Integration Tests Only
```bash
pnpm test:integration
```

### Watch Mode
```bash
pnpm test:watch
```

### With Coverage
```bash
pnpm test:coverage
```

### Verbose Output
```bash
pnpm test:verbose
```

## GTFS Snapshot Data

### What Are Snapshots?

The test suite uses **real GTFS data** downloaded from the Metra API (`https://schedules.metrarail.com/gtfs/schedule.zip`) at a specific point in time. This snapshot is stored in `fixtures/gtfs/` and used for all tests.

### Why Snapshots?

1. **Regression Testing** - Ensures code changes don't break existing functionality
2. **Consistency** - Tests run against the same data every time
3. **Offline Testing** - No network required after initial download
4. **Fast Execution** - No API calls during test runs
5. **Predictable Results** - Same input data = same expected outputs

### Snapshot Metadata

The `fixtures/gtfs/metadata.json` file contains:
- `snapshot_date` - When the snapshot was captured
- `source` - Original GTFS data URL
- `description` - Purpose of the snapshot

### Updating Snapshots

To update the GTFS snapshot with fresh data:

```bash
# Download latest GTFS data
curl -L -o /tmp/metra-gtfs-snapshot.zip 'https://schedules.metrarail.com/gtfs/schedule.zip'

# Extract to fixtures directory
unzip -o /tmp/metra-gtfs-snapshot.zip -d packages/backend/__tests__/fixtures/gtfs

# Copy ZIP file
cp /tmp/metra-gtfs-snapshot.zip packages/backend/__tests__/fixtures/schedule.zip

# Update metadata
echo "{\"snapshot_date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"source\": \"https://schedules.metrarail.com/gtfs/schedule.zip\", \"description\": \"Real Metra GTFS data snapshot for regression testing\"}" > packages/backend/__tests__/fixtures/gtfs/metadata.json

# Run tests to ensure snapshot works
pnpm test
```

## Test Coverage

### Unit Tests

#### GTFS Service (`gtfsService.test.ts`)
- Singleton pattern validation
- Data loading and parsing
- Route, stop, trip, and stop time data structure validation
- Departure calculation logic
- Service period validation (weekday vs weekend)
- GTFS time conversion (handling 24:00:00+ times)
- Data integrity (referential integrity between tables)
- Regression tests against known Metra lines

#### Search Utils (`searchUtils.test.ts`)
- Fuzzy search ranking
- Prefix vs substring matching
- Case sensitivity
- Empty and edge cases
- Special characters handling

#### Time Utils (`timeUtils.test.ts`)
- Relative time formatting ("5 min", "1h 30m")
- Absolute time formatting (12-hour format with AM/PM)
- Edge cases (midnight, noon)
- Various time ranges

### Integration Tests

#### Routes API (`routes.test.ts`)
- GET /api/routes endpoint
- Response structure validation
- Route data completeness (all Metra lines)
- Color and URL validation
- Concurrent request handling
- HTTP method validation
- CORS handling

#### Stops API (`stops.test.ts`)
- GET /api/stops/search endpoint
  - Query validation (min 2 characters)
  - Search ranking
  - Case insensitivity
  - Result limiting (max 10)
  - Error handling
- GET /api/stops/:stopId/departures endpoint
  - Departure structure validation
  - Time-based filtering (future departures only)
  - Route filtering
  - Limit parameter
  - Service period filtering (weekday/weekend)
  - Arrival exclusion (only show departures)
  - Sorting by time

#### Health Check (`health.test.ts`)
- Health check endpoint
- Error handling (404s)
- CORS headers
- Content-Type headers
- Request body parsing
- Response times
- API stability under load

## Key Test Patterns

### Using Real GTFS Data

All tests use the fixture data stored in `fixtures/gtfs/`:

```typescript
beforeAll(async () => {
  gtfsService = GTFSService.getInstance();
  (gtfsService as any).GTFS_DIR = GTFS_FIXTURES_DIR;
  await gtfsService.loadData();
});
```

### Testing with Dates

Tests use specific dates to ensure consistent service period filtering:

```typescript
const testDate = new Date('2024-12-16T08:00:00Z'); // Monday
const weekendDate = new Date('2024-12-14T08:00:00Z'); // Saturday
```

### Supertest for HTTP Testing

Integration tests use Supertest for HTTP assertions:

```typescript
const response = await request(app)
  .get('/api/routes')
  .expect('Content-Type', /json/)
  .expect(200);
```

## Regression Test Examples

### Known Metra Lines
The tests verify all 11 Metra lines are present:
- BNSF - Burlington Northern Santa Fe
- UP-N, UP-NW, UP-W - Union Pacific lines
- MD-N, MD-W - Milwaukee District lines
- NCS - North Central Service
- HC - Heritage Corridor
- ME - Metra Electric
- RI - Rock Island
- SWS - SouthWest Service

### Known Stations
Tests verify major stations exist:
- Chicago Union Station
- Ogilvie Transportation Center
- LaSalle Street Station
- Geneva, Naperville, etc.

### Route Colors
Tests verify BNSF line has correct branding:
- `route_color`: "29C233" (green)
- `route_text_color`: "000000" (black)

## Troubleshooting

### Tests Failing After Code Changes

1. Check if the change broke actual functionality
2. If functionality is correct but tests fail, update the tests
3. Run with verbose output: `pnpm test:verbose`

### GTFS Data Issues

1. Verify fixtures exist: `ls __tests__/fixtures/gtfs/`
2. Check metadata: `cat __tests__/fixtures/gtfs/metadata.json`
3. Re-download snapshot if corrupted (see "Updating Snapshots")

### Jest ESM Issues

The test scripts include `NODE_OPTIONS='--experimental-vm-modules'` because the backend uses ESM modules. If you encounter module resolution errors:

1. Ensure all imports use `.js` extensions
2. Check `jest.config.js` has correct ESM settings
3. Verify `package.json` has `"type": "module"`

### Slow Tests

1. Run only unit tests: `pnpm test:unit`
2. Use Jest's `--onlyChanged` flag
3. Check for network calls (should use fixtures only)

## Contributing

When adding new features:

1. Write unit tests for new utilities/services
2. Write integration tests for new API endpoints
3. Use the GTFS fixtures for consistency
4. Update this README with new test descriptions
5. Ensure all tests pass before submitting PR

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
- name: Run backend tests
  run: |
    cd packages/backend
    pnpm test:coverage
```

The test suite is designed to run in CI environments without external dependencies.
