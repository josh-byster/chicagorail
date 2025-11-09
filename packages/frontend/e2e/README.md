# E2E Testing with Playwright

This directory contains end-to-end tests for the Metra Train Tracker frontend application using Playwright.

## Setup

### Prerequisites

- Node.js 20 LTS
- pnpm 8+
- All project dependencies installed

### First-time Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Install Playwright browsers:
   ```bash
   pnpm --filter frontend exec playwright install --with-deps chromium
   ```

3. Build the shared package:
   ```bash
   pnpm --filter shared build
   ```

4. Build the frontend:
   ```bash
   pnpm --filter frontend build
   ```

## Running Tests

### Run all tests (headless)
```bash
pnpm --filter frontend test:e2e
```

### Run tests with UI mode (interactive)
```bash
pnpm --filter frontend test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
pnpm --filter frontend test:e2e:headed
```

### Run tests in debug mode
```bash
pnpm --filter frontend test:e2e:debug
```

### Run specific test file
```bash
pnpm --filter frontend test:e2e specs/route-search.spec.ts
```

### Run specific browser
```bash
pnpm --filter frontend test:e2e --project=chromium
pnpm --filter frontend test:e2e --project=firefox
pnpm --filter frontend test:e2e --project=webkit
```

### View test report
```bash
pnpm --filter frontend test:e2e:report
```

## Test Environment

### Test Database

E2E tests use a dedicated test database (`packages/backend/data/gtfs.test.db`) that is automatically created and populated with GTFS static data on first run.

The test database is:
- Created in `global-setup.ts`
- Populated from the public Metra GTFS feed (no API key required)
- Cached locally to speed up subsequent test runs
- Cached in CI/CD for faster builds

### Environment Variables

Test environment is configured in `.env.test` at the project root. Key settings:

- **Database**: `DATABASE_PATH=./data/gtfs.test.db`
- **Server Port**: `PORT=3001` (different from dev to avoid conflicts)
- **Realtime Features**: Disabled (no API token)
- **GTFS Static**: Public URLs (no authentication)

### Test Server

The test server is automatically managed by Playwright:

1. **Global Setup** (`global-setup.ts`):
   - Checks if test database exists
   - Imports GTFS data if needed (1-2 minutes on first run)
   - Starts backend server on port 3001
   - Waits for health check to pass

2. **Web Server** (Playwright config):
   - Starts frontend preview server on port 5173
   - Configured to reuse server in development
   - Always starts fresh in CI

3. **Global Teardown** (`global-teardown.ts`):
   - Stops backend server gracefully
   - Cleans up resources

## Directory Structure

```
e2e/
├── fixtures/          # Test data and constants
│   └── gtfs-data.ts   # Known stations, lines, routes
├── helpers/           # Helper functions
│   ├── navigation.ts  # Navigation utilities
│   └── accessibility.ts  # A11y testing helpers
├── pages/             # Page Object Models (POM)
│   ├── home.page.ts
│   ├── route.page.ts
│   ├── train-detail.page.ts
│   ├── lines.page.ts
│   ├── line-detail.page.ts
│   ├── alerts.page.ts
│   └── statistics.page.ts
├── specs/             # Test specifications
│   ├── home.spec.ts
│   ├── route-search.spec.ts
│   ├── train-detail.spec.ts
│   ├── lines.spec.ts
│   ├── alerts.spec.ts
│   ├── statistics.spec.ts
│   ├── offline.spec.ts
│   └── accessibility.spec.ts
├── global-setup.ts    # Global test setup
├── global-teardown.ts # Global test cleanup
└── README.md          # This file
```

## Test Coverage

### Functional Tests

- ✅ **Home Page**: Navigation, quick actions, keyboard shortcuts
- ✅ **Route Search**: Station selection, train results, filtering
- ✅ **Train Detail**: Stop sequence, schedules, navigation
- ✅ **Lines**: Line listing, navigation to details
- ✅ **Line Detail**: Station listing, ordering
- ✅ **Alerts**: Empty state (realtime disabled in tests)
- ✅ **Statistics**: System stats display

### PWA & Offline Tests

- ✅ Service worker installation
- ✅ Asset caching
- ✅ Offline functionality
- ✅ Offline indicator

### Accessibility Tests (WCAG 2.1 Level AA)

- ✅ No accessibility violations (using axe-core)
- ✅ Keyboard navigation
- ✅ Form labels
- ✅ Button accessible names
- ✅ Image alt text
- ✅ Heading hierarchy
- ✅ Focus indicators

## Page Object Model (POM)

Tests use the Page Object Model pattern for maintainability:

```typescript
// Example: Using RoutePage POM
import { RoutePage } from '../pages/route.page';

const routePage = new RoutePage(page);
await routePage.goto();
await routePage.selectOrigin('Chicago Union');
await routePage.selectDestination('Aurora');
await routePage.searchButton();
await routePage.waitForResults();
```

Benefits:
- **Maintainability**: UI changes only require updating POMs, not tests
- **Reusability**: Common actions are centralized
- **Readability**: Tests read like user stories
- **Type Safety**: Full TypeScript support

## Writing Tests

### Best Practices

1. **Use semantic queries** (getByRole, getByLabel, getByText) instead of CSS selectors
2. **Wait for network idle** before asserting on dynamic content
3. **Use POMs** for page interactions
4. **Keep tests independent** - each test should set up its own state
5. **Use test data from fixtures** for consistency
6. **Add accessibility checks** to new pages

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { RoutePage } from '../pages/route.page';
import { KNOWN_STATIONS } from '../fixtures/gtfs-data';

test.describe('Route Search', () => {
  let routePage: RoutePage;

  test.beforeEach(async ({ page }) => {
    routePage = new RoutePage(page);
    await routePage.goto();
  });

  test('searches for trains', async () => {
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();

    const cards = routePage.getTrainCards();
    expect(await cards.count()).toBeGreaterThan(0);
  });
});
```

## CI/CD Integration

E2E tests run automatically in GitHub Actions on:
- Push to `main` branch
- Push to `claude/**` branches
- Pull requests to `main`

### CI Features

- ✅ GTFS database caching (speeds up subsequent runs)
- ✅ Runs on Chromium only (faster, cost-effective)
- ✅ Parallel test execution disabled (CI = single worker)
- ✅ 2 retries on failure
- ✅ Playwright reports uploaded as artifacts (30 day retention)
- ✅ Test results uploaded on failure

## Troubleshooting

### Test database not found

```bash
# Manually import GTFS data
cd packages/backend
DATABASE_PATH=./data/gtfs.test.db pnpm gtfs:import
```

### Backend server not starting

Check that:
- Port 3001 is not in use
- `.env.test` file exists
- Backend builds successfully

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check network connectivity to GTFS feed
- Ensure test database is properly initialized

### Playwright browsers not installed

```bash
pnpm --filter frontend exec playwright install --with-deps chromium
```

### Clear test database and start fresh

```bash
rm packages/backend/data/gtfs.test.db
pnpm --filter frontend test:e2e
```

## Known Limitations

1. **No Realtime Testing**: Realtime GTFS features (alerts, trip updates, positions) are disabled in tests since they require an API key
2. **Static Data Only**: Tests use static GTFS schedule data
3. **Single Browser in CI**: Only Chromium runs in CI to save time/cost
4. **Mock Geolocation**: Tests that require geolocation use mock coordinates

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [Best Practices](https://playwright.dev/docs/best-practices)
