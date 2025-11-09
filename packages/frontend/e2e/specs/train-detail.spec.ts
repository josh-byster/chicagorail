import { test, expect } from '@playwright/test';
import { RoutePage } from '../pages/route.page';
import { TrainDetailPage } from '../pages/train-detail.page';
import { KNOWN_STATIONS } from '../fixtures/gtfs-data';

test.describe('Train Detail Page', () => {
  let routePage: RoutePage;
  let trainDetailPage: TrainDetailPage;

  test.beforeEach(async ({ page }) => {
    routePage = new RoutePage(page);
    trainDetailPage = new TrainDetailPage(page);
  });

  test('displays complete train schedule', async ({ page }) => {
    // Navigate via route search first
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.JOLIET.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();

    // Click first train to see details
    await routePage.clickTrainCard(0);

    // Verify URL changed
    await expect(page).toHaveURL(/\/train\/.+/);

    // Verify train info is displayed
    await expect(trainDetailPage.getTrainNumber()).toBeVisible();

    // Verify stops are listed
    const stops = trainDetailPage.getStopCards();
    const stopCount = await stops.count();
    expect(stopCount).toBeGreaterThan(0);

    // Verify at least first and last stop visible
    await expect(stops.first()).toBeVisible();
    await expect(stops.last()).toBeVisible();
  });

  test('shows all stops in sequence', async ({ page }) => {
    // Search and navigate to train detail
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.OGILVIE.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.ELBURN.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();
    await routePage.clickTrainCard(0);

    // Get stop sequence
    const sequence = await trainDetailPage.getStopSequence();

    // Verify we have multiple stops
    expect(sequence.length).toBeGreaterThan(2);

    // Verify origin is in the sequence
    const hasOrigin = sequence.some((stop) =>
      stop.toLowerCase().includes('ogilvie')
    );
    expect(hasOrigin).toBeTruthy();

    // Verify destination is in the sequence
    const hasDestination = sequence.some((stop) =>
      stop.toLowerCase().includes('elburn')
    );
    expect(hasDestination).toBeTruthy();
  });

  test('back button returns to search', async ({ page }) => {
    // Navigate to train detail
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();
    await routePage.clickTrainCard(0);

    // Verify we're on train detail page
    await expect(page).toHaveURL(/\/train\/.+/);

    // Click back button
    await trainDetailPage.goBack();

    // Verify we're back on route page
    await expect(page).toHaveURL(/\/route/);
  });

  test('displays line information', async ({ page }) => {
    // Navigate to train detail
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();
    await routePage.clickTrainCard(0);

    // Verify line name is displayed (should be BNSF for this route)
    const lineName = trainDetailPage.getLineName();
    await expect(lineName).toBeVisible();

    const lineText = await lineName.textContent();
    expect(lineText).toBeTruthy();
  });
});
