# Playwright E2E Testing Specification

## Overview

This document outlines the requirements for adding comprehensive end-to-end tests using Playwright to the chicagorail monorepo. These tests will verify critical user workflows without relying on realtime GTFS features.

## Current State

- **Playwright**: Already in dependencies (`@playwright/test@1.47.2`)
- **Current Testing**: Vitest unit tests for frontend and backend
- **E2E Tests**: None (commented out in CI)
- **Test Scripts**: `pnpm --filter frontend test:e2e` exists but not implemented

## Goals

1. ✅ Verify end-to-end user workflows across all 7 pages
2. ✅ Test API integration between frontend and backend
3. ✅ Ensure offline/PWA functionality works
4. ✅ Validate accessibility (WCAG 2.1 Level AA)
5. ✅ Test with real GTFS static data from Metra
6. ✅ Integrate with CI/CD pipeline
7. ❌ Do NOT test realtime features (alerts, positions, trip updates)

## Test Environment Setup

### 1. Test Database Strategy

**Approach**: Use a dedicated test database with imported GTFS static data

```bash
# Setup test database
TEST_DATABASE_PATH=./data/gtfs.test.db
```

**Initialization**:
1. Download `https://schedules.metrarail.com/gtfs/schedule.zip` (publicly accessible)
2. Import into test database using existing `import-gtfs.ts` script
3. Cache the test database in CI for faster test runs
4. Reset test database between test runs (optional, based on test isolation needs)

### 2. Environment Variables

Create `.env.test` file:

```env
# Database
DATABASE_PATH=./data/gtfs.test.db

# Server
PORT=3001
NODE_ENV=test

# GTFS Static (public URLs - no API key needed)
GTFS_STATIC_SCHEDULE_URL=https://schedules.metrarail.com/gtfs/schedule.zip
GTFS_STATIC_PUBLISHED_URL=https://schedules.metrarail.com/gtfs/published.txt

# Disable realtime features
METRA_API_TOKEN=
GTFS_REALTIME_ALERTS_URL=
GTFS_REALTIME_TRIP_UPDATES_URL=
GTFS_REALTIME_VEHICLE_POSITIONS_URL=

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### 3. Test Server Setup

Create a test server script that:
1. Loads `.env.test` configuration
2. Starts backend on port 3001
3. Builds and serves frontend in preview mode
4. Runs before Playwright tests
5. Tears down after tests complete

## Playwright Configuration

### File: `packages/frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  // Timeouts
  timeout: 30000,
  expect: {
    timeout: 5000
  },

  // Execution
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporting
  reporter: process.env.CI
    ? [['html'], ['github']]
    : [['html'], ['list']],

  // Global setup
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Local dev server
  webServer: {
    command: 'pnpm test:e2e:server',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for GTFS import
  },
});
```

## Directory Structure

```
packages/frontend/
├── e2e/
│   ├── fixtures/
│   │   ├── test-context.ts         # Custom fixtures (API mocks, auth, etc.)
│   │   └── gtfs-data.ts            # Test data helpers
│   ├── helpers/
│   │   ├── navigation.ts           # Page navigation helpers
│   │   ├── assertions.ts           # Custom assertions
│   │   └── accessibility.ts        # A11y testing utilities
│   ├── pages/
│   │   ├── home.page.ts            # HomePage POM
│   │   ├── route.page.ts           # RoutePage POM
│   │   ├── train-detail.page.ts    # TrainDetailPage POM
│   │   ├── alerts.page.ts          # AlertsPage POM
│   │   ├── lines.page.ts           # LinesPage POM
│   │   ├── line-detail.page.ts     # LineDetailPage POM
│   │   └── statistics.page.ts      # StatisticsPage POM
│   ├── specs/
│   │   ├── home.spec.ts            # Home page tests
│   │   ├── route-search.spec.ts    # Route search workflow
│   │   ├── train-detail.spec.ts    # Train detail tests
│   │   ├── alerts.spec.ts          # Alerts page tests
│   │   ├── lines.spec.ts           # Lines browsing tests
│   │   ├── saved-routes.spec.ts    # Saved routes feature
│   │   ├── nearby-stations.spec.ts # Geolocation tests
│   │   ├── offline.spec.ts         # PWA offline tests
│   │   ├── accessibility.spec.ts   # A11y compliance tests
│   │   └── mobile.spec.ts          # Mobile-specific tests
│   ├── global-setup.ts             # Start test server, import GTFS
│   ├── global-teardown.ts          # Stop test server, cleanup
│   └── playwright.config.ts        # Playwright configuration
└── package.json
```

## Test Scenarios

### 1. Home Page (`home.spec.ts`)

**File**: `packages/frontend/e2e/specs/home.spec.ts`

```typescript
test.describe('Home Page', () => {
  test('displays quick stats dashboard', async ({ page }) => {
    await page.goto('/');

    // Verify quick stats cards
    await expect(page.getByRole('heading', { name: 'Total Stations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Lines' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Routes Today' })).toBeVisible();
  });

  test('shows recent searches if available', async ({ page }) => {
    // TODO: Set up IndexedDB with recent search data
    await page.goto('/');

    const recentSearches = page.getByTestId('recent-searches');
    await expect(recentSearches).toBeVisible();
  });

  test('quick action buttons navigate correctly', async ({ page }) => {
    await page.goto('/');

    // Test "Find Route" button
    await page.getByRole('button', { name: 'Find Route' }).click();
    await expect(page).toHaveURL('/route');

    // Navigate back
    await page.goto('/');

    // Test "View Lines" button
    await page.getByRole('button', { name: 'View Lines' }).click();
    await expect(page).toHaveURL('/lines');
  });

  test('keyboard shortcuts dialog opens', async ({ page }) => {
    await page.goto('/');

    // Press "?" to open shortcuts
    await page.keyboard.press('?');

    await expect(page.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeVisible();
  });
});
```

### 2. Route Search (`route-search.spec.ts`)

**File**: `packages/frontend/e2e/specs/route-search.spec.ts`

```typescript
test.describe('Route Search', () => {
  test('complete route search flow', async ({ page }) => {
    await page.goto('/route');

    // Select origin station
    const originSelect = page.getByLabel('From');
    await originSelect.click();
    await page.getByRole('option', { name: /Chicago Union Station/i }).click();

    // Select destination station
    const destSelect = page.getByLabel('To');
    await destSelect.click();
    await page.getByRole('option', { name: /Aurora/i }).click();

    // Submit search
    await page.getByRole('button', { name: 'Search Trains' }).click();

    // Verify results appear
    await expect(page.getByTestId('train-list')).toBeVisible();
    await expect(page.getByTestId('train-card').first()).toBeVisible();
  });

  test('shows reachable stations based on origin', async ({ page }) => {
    await page.goto('/route');

    // Select origin
    const originSelect = page.getByLabel('From');
    await originSelect.click();
    await page.getByRole('option', { name: /Ogilvie Transportation Center/i }).click();

    // Open destination dropdown
    const destSelect = page.getByLabel('To');
    await destSelect.click();

    // Verify only reachable stations are shown (UP-N, UP-NW, UP-W lines)
    const options = page.getByRole('listbox').getByRole('option');
    const count = await options.count();

    expect(count).toBeGreaterThan(0);
    // Verify no unreachable stations (e.g., Rock Island line stations)
    await expect(page.getByRole('option', { name: /Joliet/i })).not.toBeVisible();
  });

  test('filters trains by time', async ({ page }) => {
    await page.goto('/route');

    // Setup search
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Chicago Union Station/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Joliet/i }).click();

    // Set specific time
    await page.getByLabel('Departure Time').fill('14:00');

    await page.getByRole('button', { name: 'Search Trains' }).click();

    // Verify results are filtered
    const firstTrain = page.getByTestId('train-card').first();
    await expect(firstTrain).toBeVisible();

    const departureTime = await firstTrain.getByTestId('departure-time').textContent();
    // Departure should be >= 14:00
    expect(departureTime).toBeTruthy();
  });

  test('saves route for later', async ({ page }) => {
    await page.goto('/route');

    // Perform search
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Ogilvie/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Elburn/i }).click();

    await page.getByRole('button', { name: 'Search Trains' }).click();

    // Save route
    await page.getByRole('button', { name: 'Save Route' }).click();
    await page.getByLabel('Route Name').fill('Work Commute');
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify saved routes section appears
    await expect(page.getByTestId('saved-routes')).toBeVisible();
    await expect(page.getByText('Work Commute')).toBeVisible();
  });

  test('loads saved route', async ({ page }) => {
    // TODO: Pre-populate IndexedDB with saved route
    await page.goto('/route');

    // Click on saved route
    await page.getByTestId('saved-route-card').first().click();

    // Verify origin and destination are populated
    await expect(page.getByLabel('From')).not.toBeEmpty();
    await expect(page.getByLabel('To')).not.toBeEmpty();

    // Verify trains are loaded
    await expect(page.getByTestId('train-list')).toBeVisible();
  });
});
```

### 3. Train Detail (`train-detail.spec.ts`)

**File**: `packages/frontend/e2e/specs/train-detail.spec.ts`

```typescript
test.describe('Train Detail Page', () => {
  test('displays complete train schedule', async ({ page }) => {
    // Navigate via route search first
    await page.goto('/route');
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Chicago Union Station/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Joliet/i }).click();
    await page.getByRole('button', { name: 'Search Trains' }).click();

    // Click first train to see details
    await page.getByTestId('train-card').first().click();

    // Verify URL changed
    await expect(page).toHaveURL(/\/train\/.+/);

    // Verify train info
    await expect(page.getByTestId('train-number')).toBeVisible();
    await expect(page.getByTestId('line-name')).toBeVisible();

    // Verify all stops are listed
    const stops = page.getByTestId('stop-card');
    const stopCount = await stops.count();
    expect(stopCount).toBeGreaterThan(0);

    // Verify first and last stop
    await expect(stops.first().getByTestId('station-name')).toBeVisible();
    await expect(stops.last().getByTestId('station-name')).toBeVisible();
  });

  test('highlights origin and destination stops', async ({ page }) => {
    await page.goto('/route');

    // Search Chicago Union to Aurora
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Chicago Union/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Aurora/i }).click();
    await page.getByRole('button', { name: 'Search' }).click();

    // Click train
    await page.getByTestId('train-card').first().click();

    // Verify origin/destination highlighting
    const originStop = page.getByTestId('stop-origin');
    await expect(originStop).toBeVisible();
    await expect(originStop).toHaveCSS('border-color', /green|success/);

    const destStop = page.getByTestId('stop-destination');
    await expect(destStop).toBeVisible();
    await expect(destStop).toHaveCSS('border-color', /red|destructive/);
  });

  test('shows map visualization if available', async ({ page }) => {
    await page.goto('/route');
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Ogilvie/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Elburn/i }).click();
    await page.getByRole('button', { name: 'Search' }).click();

    await page.getByTestId('train-card').first().click();

    // Check if map container exists
    const mapContainer = page.getByTestId('map-visualization');
    if (await mapContainer.isVisible()) {
      await expect(mapContainer).toBeVisible();
    }
  });
});
```

### 4. Alerts Page (`alerts.spec.ts`)

**File**: `packages/frontend/e2e/specs/alerts.spec.ts`

```typescript
test.describe('Alerts Page', () => {
  test('displays message when no alerts available', async ({ page }) => {
    // Since realtime is disabled, alerts should be empty
    await page.goto('/alerts');

    await expect(page.getByText(/No active alerts/i)).toBeVisible();
  });

  test('can filter by line (when alerts exist)', async ({ page }) => {
    // This test would work if we mock alerts data
    // TODO: Add fixture for mock alerts in IndexedDB
    await page.goto('/alerts');

    const lineFilter = page.getByLabel('Filter by Line');
    await expect(lineFilter).toBeVisible();
  });
});
```

### 5. Lines Page (`lines.spec.ts`)

**File**: `packages/frontend/e2e/specs/lines.spec.ts`

```typescript
test.describe('Lines Page', () => {
  test('displays all Metra lines', async ({ page }) => {
    await page.goto('/lines');

    // Verify all 11 Metra lines are shown
    const lineCards = page.getByTestId('line-card');
    const count = await lineCards.count();

    expect(count).toBe(11); // Metra has 11 lines

    // Verify some key lines
    await expect(page.getByText('BNSF Railway')).toBeVisible();
    await expect(page.getByText('Union Pacific North')).toBeVisible();
    await expect(page.getByText('Rock Island')).toBeVisible();
  });

  test('navigates to line detail page', async ({ page }) => {
    await page.goto('/lines');

    // Click on BNSF line
    await page.getByTestId('line-card').filter({ hasText: 'BNSF' }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/lines\/.+/);
    await expect(page.getByRole('heading', { name: /BNSF/i })).toBeVisible();
  });

  test('shows line status indicators', async ({ page }) => {
    await page.goto('/lines');

    // Each line should have a status badge
    const lineCards = page.getByTestId('line-card');
    const firstCard = lineCards.first();

    await expect(firstCard.getByTestId('line-status')).toBeVisible();
  });
});
```

### 6. Line Detail Page (`line-detail.spec.ts`)

**File**: `packages/frontend/e2e/specs/line-detail.spec.ts`

```typescript
test.describe('Line Detail Page', () => {
  test('shows all stations for a line', async ({ page }) => {
    await page.goto('/lines');

    // Navigate to UP-N line
    await page.getByText('Union Pacific North').click();

    // Verify stations are listed
    const stationCards = page.getByTestId('station-card');
    const count = await stationCards.count();

    expect(count).toBeGreaterThan(0);

    // Verify key stations
    await expect(page.getByText('Ogilvie Transportation Center')).toBeVisible();
    await expect(page.getByText('Kenosha')).toBeVisible();
  });

  test('stations are ordered by route sequence', async ({ page }) => {
    await page.goto('/lines');
    await page.getByText('BNSF Railway').click();

    const stations = page.getByTestId('station-card');
    const firstStation = await stations.first().textContent();
    const lastStation = await stations.last().textContent();

    // BNSF goes from Chicago Union to Aurora
    expect(firstStation).toContain('Chicago Union');
    expect(lastStation).toContain('Aurora');
  });

  test('clicking station opens route search', async ({ page }) => {
    await page.goto('/lines');
    await page.getByText('Rock Island').click();

    // Click a station
    await page.getByTestId('station-card').filter({ hasText: 'Joliet' }).click();

    // Should navigate to route page with origin pre-filled
    await expect(page).toHaveURL('/route');
    await expect(page.getByLabel('From')).toHaveValue(/Joliet/i);
  });
});
```

### 7. Statistics Page (`statistics.spec.ts`)

**File**: `packages/frontend/e2e/specs/statistics.spec.ts`

```typescript
test.describe('Statistics Page', () => {
  test('displays system statistics', async ({ page }) => {
    await page.goto('/statistics');

    // Verify stat cards
    await expect(page.getByText('Total Stations')).toBeVisible();
    await expect(page.getByText('Active Lines')).toBeVisible();
    await expect(page.getByText('Total Trips')).toBeVisible();

    // Verify numeric values
    const totalStations = page.getByTestId('stat-total-stations');
    await expect(totalStations).toBeVisible();

    const stationCount = await totalStations.textContent();
    expect(Number(stationCount)).toBeGreaterThan(0);
  });

  test('shows usage charts if available', async ({ page }) => {
    await page.goto('/statistics');

    // Check for chart containers
    const chartContainer = page.getByTestId('usage-chart');
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toBeVisible();
    }
  });
});
```

### 8. Saved Routes (`saved-routes.spec.ts`)

**File**: `packages/frontend/e2e/specs/saved-routes.spec.ts`

```typescript
test.describe('Saved Routes Feature', () => {
  test('saves and retrieves routes from IndexedDB', async ({ page }) => {
    await page.goto('/route');

    // Create saved route
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Chicago Union/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Joliet/i }).click();

    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Save Route' }).click();
    await page.getByLabel('Route Name').fill('Morning Commute');
    await page.getByRole('button', { name: 'Save' }).click();

    // Refresh page
    await page.reload();

    // Verify route persisted
    await expect(page.getByText('Morning Commute')).toBeVisible();
  });

  test('deletes saved route', async ({ page }) => {
    // TODO: Pre-populate with saved route
    await page.goto('/route');

    // Find saved route
    const savedRoute = page.getByTestId('saved-route-card').first();

    // Delete
    await savedRoute.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Verify removed
    await expect(savedRoute).not.toBeVisible();
  });
});
```

### 9. Nearby Stations (`nearby-stations.spec.ts`)

**File**: `packages/frontend/e2e/specs/nearby-stations.spec.ts`

```typescript
test.describe('Nearby Stations (Geolocation)', () => {
  test('requests geolocation permission', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);

    // Set mock location (Chicago coordinates)
    await context.setGeolocation({ latitude: 41.8781, longitude: -87.6298 });

    await page.goto('/');

    // Click "Nearby Stations" button
    await page.getByRole('button', { name: 'Nearby Stations' }).click();

    // Verify nearby stations appear
    await expect(page.getByTestId('nearby-stations-list')).toBeVisible();
  });

  test('shows error when geolocation denied', async ({ page, context }) => {
    await page.goto('/');

    // Click nearby stations without permission
    await page.getByRole('button', { name: 'Nearby Stations' }).click();

    // Verify error message
    await expect(page.getByText(/location permission/i)).toBeVisible();
  });

  test('calculates distances correctly', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);

    // Set location near Ogilvie (41.8825, -87.6399)
    await context.setGeolocation({ latitude: 41.8825, longitude: -87.6399 });

    await page.goto('/');
    await page.getByRole('button', { name: 'Nearby Stations' }).click();

    // Verify Ogilvie is in the list and has distance
    const ogilvieStation = page.getByTestId('nearby-station').filter({ hasText: 'Ogilvie' });
    await expect(ogilvieStation).toBeVisible();

    const distance = await ogilvieStation.getByTestId('distance').textContent();
    expect(distance).toMatch(/\d+\.?\d*\s*(mi|km)/);
  });
});
```

### 10. Offline/PWA (`offline.spec.ts`)

**File**: `packages/frontend/e2e/specs/offline.spec.ts`

```typescript
test.describe('PWA and Offline Functionality', () => {
  test('installs service worker', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker registration
    const swRegistered = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(() => resolve(true));
        } else {
          resolve(false);
        }
      });
    });

    expect(swRegistered).toBe(true);
  });

  test('caches static assets', async ({ page }) => {
    await page.goto('/');

    // Check cache storage
    const hasCachedAssets = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.length > 0;
    });

    expect(hasCachedAssets).toBe(true);
  });

  test('works offline after initial load', async ({ page, context }) => {
    // Load app while online
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Perform a search to cache data
    await page.goto('/route');
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Chicago Union/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Aurora/i }).click();
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate to lines page
    await page.goto('/lines');

    // Verify page loads from cache
    await expect(page.getByText('BNSF Railway')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });

  test('shows offline indicator when disconnected', async ({ page, context }) => {
    await page.goto('/');

    // Go offline
    await context.setOffline(true);

    // Verify offline indicator appears
    await expect(page.getByTestId('offline-indicator')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Verify indicator disappears
    await expect(page.getByTestId('offline-indicator')).not.toBeVisible();
  });
});
```

### 11. Accessibility (`accessibility.spec.ts`)

**File**: `packages/frontend/e2e/specs/accessibility.spec.ts`

```typescript
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG 2.1 Level AA)', () => {
  test('home page has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('route search page has no violations', async ({ page }) => {
    await page.goto('/route');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('train detail page has no violations', async ({ page }) => {
    // Navigate to train detail
    await page.goto('/route');
    await page.getByLabel('From').click();
    await page.getByRole('option', { name: /Chicago Union/i }).click();
    await page.getByLabel('To').click();
    await page.getByRole('option', { name: /Aurora/i }).click();
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByTestId('train-card').first().click();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);
  });

  test('skip to main content link works', async ({ page }) => {
    await page.goto('/');

    // Press Tab to focus skip link
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: /skip to main/i });
    if (await skipLink.isVisible()) {
      await skipLink.click();

      // Verify main content is focused
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeFocused();
    }
  });
});
```

### 12. Mobile (`mobile.spec.ts`)

**File**: `packages/frontend/e2e/specs/mobile.spec.ts`

```typescript
import { test as base, expect } from '@playwright/test';
import { devices } from '@playwright/test';

const test = base.extend({
  // Override browser to use mobile viewport
  viewport: devices['iPhone 12'].viewport,
  userAgent: devices['iPhone 12'].userAgent,
});

test.describe('Mobile Experience', () => {
  test('navigation menu opens on mobile', async ({ page }) => {
    await page.goto('/');

    // Click hamburger menu
    await page.getByRole('button', { name: /menu/i }).click();

    // Verify nav drawer opens
    await expect(page.getByRole('navigation')).toBeVisible();

    // Click route link
    await page.getByRole('link', { name: /route/i }).click();

    // Verify navigation
    await expect(page).toHaveURL('/route');
  });

  test('touch gestures work for station selection', async ({ page }) => {
    await page.goto('/route');

    // Tap origin select
    await page.getByLabel('From').tap();

    // Verify options appear
    await expect(page.getByRole('listbox')).toBeVisible();

    // Tap an option
    await page.getByRole('option', { name: /Chicago Union/i }).tap();

    // Verify selection
    await expect(page.getByLabel('From')).toHaveValue(/Chicago Union/i);
  });

  test('quick action FAB is accessible on mobile', async ({ page }) => {
    await page.goto('/');

    // Verify FAB appears
    const fab = page.getByTestId('quick-actions-fab');
    await expect(fab).toBeVisible();

    // Tap FAB
    await fab.tap();

    // Verify actions appear
    await expect(page.getByRole('menu')).toBeVisible();
  });

  test('responsive layout adjusts to screen size', async ({ page }) => {
    await page.goto('/route');

    // Verify mobile layout
    const container = page.getByTestId('route-search-container');
    const width = await container.evaluate((el) => el.offsetWidth);

    // Should use full width on mobile
    expect(width).toBeGreaterThan(300);
  });
});
```

## Page Object Model (POM) Examples

### Example: `route.page.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class RoutePage {
  readonly page: Page;
  readonly originSelect: Locator;
  readonly destinationSelect: Locator;
  readonly searchButton: Locator;
  readonly trainList: Locator;
  readonly saveRouteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.originSelect = page.getByLabel('From');
    this.destinationSelect = page.getByLabel('To');
    this.searchButton = page.getByRole('button', { name: 'Search Trains' });
    this.trainList = page.getByTestId('train-list');
    this.saveRouteButton = page.getByRole('button', { name: 'Save Route' });
  }

  async goto() {
    await this.page.goto('/route');
  }

  async selectOrigin(stationName: string) {
    await this.originSelect.click();
    await this.page.getByRole('option', { name: new RegExp(stationName, 'i') }).click();
  }

  async selectDestination(stationName: string) {
    await this.destinationSelect.click();
    await this.page.getByRole('option', { name: new RegExp(stationName, 'i') }).click();
  }

  async searchTrains() {
    await this.searchButton.click();
  }

  async waitForResults() {
    await this.trainList.waitFor({ state: 'visible' });
  }

  async saveRoute(routeName: string) {
    await this.saveRouteButton.click();
    await this.page.getByLabel('Route Name').fill(routeName);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
}
```

## Global Setup/Teardown

### `global-setup.ts`

```typescript
import { FullConfig } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let backendProcess: ChildProcess | null = null;

export default async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting test environment setup...');

  // 1. Setup test database path
  const testDbPath = path.join(__dirname, '../../backend/data/gtfs.test.db');
  const testDbDir = path.dirname(testDbPath);

  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }

  // 2. Check if test DB exists, if not import GTFS data
  if (!fs.existsSync(testDbPath)) {
    console.log('📦 Test database not found, importing GTFS data...');

    // Run import script with test environment
    const importProcess = spawn('pnpm', ['--filter', 'backend', 'gtfs:import'], {
      cwd: path.join(__dirname, '../../..'),
      env: {
        ...process.env,
        DATABASE_PATH: testDbPath,
        NODE_ENV: 'test',
      },
      stdio: 'inherit',
    });

    await new Promise((resolve, reject) => {
      importProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ GTFS data imported successfully');
          resolve(null);
        } else {
          reject(new Error(`GTFS import failed with code ${code}`));
        }
      });
    });
  } else {
    console.log('✅ Test database already exists');
  }

  // 3. Start backend server
  console.log('🔧 Starting backend server...');

  backendProcess = spawn('pnpm', ['--filter', 'backend', 'dev'], {
    cwd: path.join(__dirname, '../../..'),
    env: {
      ...process.env,
      DATABASE_PATH: testDbPath,
      PORT: '3001',
      NODE_ENV: 'test',
    },
    stdio: 'pipe',
  });

  // Wait for backend to be ready
  await new Promise((resolve) => {
    backendProcess!.stdout?.on('data', (data) => {
      if (data.toString().includes('Server listening')) {
        console.log('✅ Backend server started');
        resolve(null);
      }
    });
  });

  // Store backend PID for cleanup
  process.env.BACKEND_PID = backendProcess.pid?.toString();

  console.log('🎉 Test environment ready!');
}
```

### `global-teardown.ts`

```typescript
import { FullConfig } from '@playwright/test';

export default async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up test environment...');

  // Kill backend process
  const backendPid = process.env.BACKEND_PID;
  if (backendPid) {
    try {
      process.kill(Number(backendPid));
      console.log('✅ Backend server stopped');
    } catch (error) {
      console.error('❌ Failed to stop backend:', error);
    }
  }

  console.log('👋 Teardown complete');
}
```

## Test Data Helpers

### `fixtures/gtfs-data.ts`

```typescript
/**
 * Known GTFS test data for assertions
 * This data is based on the public Metra GTFS feed
 */

export const KNOWN_STATIONS = {
  CHICAGO_UNION: {
    name: 'Chicago Union Station',
    stopId: 'CUS',
  },
  OGILVIE: {
    name: 'Ogilvie Transportation Center',
    stopId: 'OTC',
  },
  AURORA: {
    name: 'Aurora',
    stopId: 'AURORA',
  },
  JOLIET: {
    name: 'Joliet',
    stopId: 'JOLIET',
  },
} as const;

export const KNOWN_LINES = {
  BNSF: {
    name: 'BNSF Railway',
    routeId: 'BNSF',
    color: '#00a651',
  },
  UP_N: {
    name: 'Union Pacific North',
    routeId: 'UP-N',
    color: '#c60c30',
  },
  ROCK_ISLAND: {
    name: 'Rock Island',
    routeId: 'RI',
    color: '#1c4c9c',
  },
} as const;

export const TOTAL_METRA_LINES = 11;
```

## CI/CD Integration

### Update `.github/workflows/ci.yml`

```yaml
name: CI Checks

on:
  push:
    branches: [main, 'claude/**']
  pull_request:
    branches: [main]

jobs:
  # ... existing lint-and-typecheck, test-backend, test-frontend jobs ...

  # NEW: E2E Tests
  test-e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Cache GTFS test database
        id: cache-gtfs-db
        uses: actions/cache@v3
        with:
          path: packages/backend/data/gtfs.test.db
          key: gtfs-test-db-${{ hashFiles('.env.example') }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared package
        run: pnpm --filter shared build

      - name: Install Playwright browsers
        run: pnpm --filter frontend exec playwright install --with-deps chromium

      - name: Import GTFS data (if not cached)
        if: steps.cache-gtfs-db.outputs.cache-hit != 'true'
        run: |
          pnpm --filter backend gtfs:import
        env:
          DATABASE_PATH: ./data/gtfs.test.db
          NODE_ENV: test
          GTFS_STATIC_SCHEDULE_URL: https://schedules.metrarail.com/gtfs/schedule.zip

      - name: Run Playwright tests
        run: pnpm --filter frontend test:e2e
        env:
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: packages/frontend/playwright-report/
          retention-days: 30

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-results
          path: packages/frontend/test-results/
          retention-days: 30
```

## Package.json Updates

### `packages/frontend/package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:server": "pnpm --filter backend dev & wait-on http://localhost:3001/api/health && pnpm preview --port 5173",
    "test:e2e:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.2",
    "@axe-core/playwright": "^4.10.0",
    "wait-on": "^8.0.1"
  }
}
```

## Additional Dependencies

```bash
# Install from frontend directory
pnpm add -D @axe-core/playwright wait-on
```

## Test Execution Commands

```bash
# Run all E2E tests
pnpm --filter frontend test:e2e

# Run with UI mode (interactive)
pnpm --filter frontend test:e2e:ui

# Run specific test file
pnpm --filter frontend test:e2e specs/route-search.spec.ts

# Run in debug mode
pnpm --filter frontend test:e2e:debug

# Run on specific browser
pnpm --filter frontend test:e2e --project=chromium

# Run mobile tests only
pnpm --filter frontend test:e2e --grep mobile

# View HTML report
pnpm --filter frontend test:e2e:report
```

## Coverage Targets

- **Test Coverage**: 80% of critical user flows
- **Browser Coverage**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Accessibility**: 100% WCAG 2.1 Level AA compliance
- **Performance**: Tests complete in <5 minutes locally, <10 minutes in CI

## Success Criteria

✅ All critical user workflows have E2E tests
✅ Tests run in CI/CD pipeline on every PR
✅ Tests pass on all target browsers
✅ Accessibility violations are caught automatically
✅ PWA/offline functionality is verified
✅ Test database setup is automated
✅ Clear test reports generated
✅ Tests are maintainable with Page Object Model

## Estimated Implementation Time

- **Playwright Setup**: 2-3 hours
- **Test Database Setup**: 1-2 hours
- **Page Object Models**: 3-4 hours
- **Test Scenarios (all 12 specs)**: 8-12 hours
- **CI/CD Integration**: 2-3 hours
- **Documentation**: 1-2 hours

**Total**: ~20-25 hours

## Next Steps

1. ✅ Review this specification
2. ⏳ Implement Playwright configuration
3. ⏳ Set up test database infrastructure
4. ⏳ Create Page Object Models
5. ⏳ Write test scenarios (start with critical paths)
6. ⏳ Integrate with CI/CD
7. ⏳ Document test maintenance procedures
8. ⏳ Train team on Playwright best practices
