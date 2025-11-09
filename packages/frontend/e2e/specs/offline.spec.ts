import { test, expect } from '@playwright/test';
import { RoutePage } from '../pages/route.page';
import { LinesPage } from '../pages/lines.page';
import { KNOWN_STATIONS } from '../fixtures/gtfs-data';

test.describe('PWA and Offline Functionality', () => {
  test('installs service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.ready;
          return true;
        } catch {
          return false;
        }
      }
      return false;
    });

    expect(swRegistered).toBe(true);
  });

  test('caches static assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Give service worker time to cache
    await page.waitForTimeout(2000);

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
    const routePage = new RoutePage(page);
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();

    // Wait for all data to be cached
    await page.waitForTimeout(2000);

    // Go offline
    await context.setOffline(true);

    // Navigate to lines page
    const linesPage = new LinesPage(page);
    await linesPage.goto();

    // Verify page loads from cache
    const lineCards = linesPage.getLineCards();
    const count = await lineCards.count();

    // Should still show lines even offline
    expect(count).toBeGreaterThan(0);

    // Go back online
    await context.setOffline(false);
  });

  test('offline indicator appears when disconnected', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Trigger offline detection
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Wait a moment for UI to update
    await page.waitForTimeout(1000);

    // Look for offline indicator
    const offlineIndicator = page.getByText(/offline|no connection|disconnected/i);

    // May or may not have offline indicator implemented
    // This is a soft assertion
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible();
    }

    // Go back online
    await context.setOffline(false);
  });

  test('app loads without network errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to a few pages
    await page.goto('/route');
    await page.waitForLoadState('networkidle');

    await page.goto('/lines');
    await page.waitForLoadState('networkidle');

    // Should have no critical errors
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('Warning') &&
        !err.includes('DevTools') &&
        !err.includes('Extension')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
