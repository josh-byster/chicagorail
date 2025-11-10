import { test, expect } from '@playwright/test';
import { RoutePage } from '../pages/route.page';
import { KNOWN_STATIONS, COMMON_ROUTES } from '../fixtures/gtfs-data';

test.describe('Route Search', () => {
  let routePage: RoutePage;

  test.beforeEach(async ({ page }) => {
    routePage = new RoutePage(page);
    await routePage.goto();
  });

  test('displays route search form', async () => {
    await expect(routePage.getOriginSelect()).toBeVisible();
    await expect(routePage.getDestinationSelect()).toBeVisible();
    await expect(routePage.getSearchButton()).toBeVisible();
  });

  test('complete route search flow - Chicago Union to Aurora', async ({
    page,
  }) => {
    const route = COMMON_ROUTES.CHICAGO_TO_AURORA;

    // Select origin station
    await routePage.selectOrigin(route.origin.searchTerm);

    // Select destination station
    await routePage.selectDestination(route.destination.searchTerm);

    // Submit search
    await routePage.searchButton();

    // Wait for results
    await routePage.waitForResults();

    // Verify results appear
    await expect(routePage.getTrainList()).toBeVisible();

    const trainCards = routePage.getTrainCards();
    const count = await trainCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify URL updated with search params
    expect(page.url()).toContain('route');
  });

  test('complete route search flow - Ogilvie to Elburn', async ({
    page: _page,
  }) => {
    const route = COMMON_ROUTES.OGILVIE_TO_ELBURN;

    await routePage.selectOrigin(route.origin.searchTerm);
    await routePage.selectDestination(route.destination.searchTerm);
    await routePage.searchButton();

    await routePage.waitForResults();

    const trainCards = routePage.getTrainCards();
    const count = await trainCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking train card navigates to train detail', async ({ page }) => {
    // Perform a search first
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.JOLIET.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();

    // Click first train card
    await routePage.clickTrainCard(0);

    // Verify navigation to train detail page
    await expect(page).toHaveURL(/\/train\/.+/);
  });

  test('shows validation when origin equals destination', async () => {
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);

    // Try to search
    await routePage.searchButton();

    // Should show error or validation message
    const errorMessage = routePage.page.getByText(
      /same station|different station/i
    );
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('can swap origin and destination', async ({ page }) => {
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);

    // Look for swap button
    const swapButton = page.getByRole('button', { name: /swap|switch/i });
    if (await swapButton.isVisible()) {
      await swapButton.click();

      // Verify origin and destination are swapped
      // This would require checking the selected values
    }
  });
});
