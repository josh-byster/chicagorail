import { test, expect } from '@playwright/test';
import { LinesPage } from '../pages/lines.page';
import { LineDetailPage } from '../pages/line-detail.page';
import { TOTAL_METRA_LINES, KNOWN_LINES } from '../fixtures/gtfs-data';

test.describe('Lines Page', () => {
  let linesPage: LinesPage;

  test.beforeEach(async ({ page }) => {
    linesPage = new LinesPage(page);
    await linesPage.goto();
  });

  test('displays all Metra lines', async () => {
    const lineCards = linesPage.getLineCards();
    const count = await lineCards.count();

    // Metra has 11 lines
    expect(count).toBe(TOTAL_METRA_LINES);
  });

  test('shows key Metra lines', async ({ page }) => {
    // Verify some key lines are visible
    await expect(page.getByText(KNOWN_LINES.BNSF.searchTerm)).toBeVisible();
    await expect(
      page.getByText(KNOWN_LINES.UP_N.searchTerm)
    ).toBeVisible();
    await expect(
      page.getByText(KNOWN_LINES.ROCK_ISLAND.searchTerm)
    ).toBeVisible();
  });

  test('navigates to line detail page', async ({ page }) => {
    // Click on BNSF line
    await linesPage.clickLine(KNOWN_LINES.BNSF.searchTerm);

    // Verify navigation
    await expect(page).toHaveURL(/\/lines\/.+/);

    // Verify line name is displayed
    await expect(
      page.getByRole('heading', { name: new RegExp(KNOWN_LINES.BNSF.searchTerm, 'i') })
    ).toBeVisible();
  });

  test('each line card is clickable', async () => {
    const lineCards = linesPage.getLineCards();
    const firstCard = lineCards.first();

    // Verify card is visible and clickable
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toBeEnabled();
  });
});

test.describe('Line Detail Page', () => {
  let lineDetailPage: LineDetailPage;

  test.beforeEach(async ({ page }) => {
    lineDetailPage = new LineDetailPage(page);
  });

  test('shows all stations for BNSF line', async ({ page }) => {
    // Navigate via lines page
    const linesPage = new LinesPage(page);
    await linesPage.goto();
    await linesPage.clickLine(KNOWN_LINES.BNSF.searchTerm);

    // Verify stations are listed
    const stationCards = lineDetailPage.getStationCards();
    const count = await stationCards.count();

    expect(count).toBeGreaterThan(0);

    // Verify key stations for BNSF (Chicago Union to Aurora)
    await expect(page.getByText(/Chicago Union/i)).toBeVisible();
    await expect(page.getByText(/Aurora/i)).toBeVisible();
  });

  test('shows all stations for UP-N line', async ({ page }) => {
    const linesPage = new LinesPage(page);
    await linesPage.goto();
    await linesPage.clickLine(KNOWN_LINES.UP_N.searchTerm);

    // Verify key stations for UP-N (Ogilvie to Kenosha)
    await expect(page.getByText(/Ogilvie/i)).toBeVisible();
    await expect(page.getByText(/Kenosha/i)).toBeVisible();
  });

  test('stations are displayed in order', async ({ page }) => {
    const linesPage = new LinesPage(page);
    await linesPage.goto();
    await linesPage.clickLine(KNOWN_LINES.BNSF.searchTerm);

    const stations = await lineDetailPage.getStationNames();

    // Verify we have stations
    expect(stations.length).toBeGreaterThan(0);

    // First station should be Chicago Union
    expect(stations[0]).toMatch(/Chicago Union/i);

    // Last station should be Aurora
    expect(stations[stations.length - 1]).toMatch(/Aurora/i);
  });

  test('back button returns to lines list', async ({ page }) => {
    const linesPage = new LinesPage(page);
    await linesPage.goto();
    await linesPage.clickLine(KNOWN_LINES.BNSF.searchTerm);

    // Verify we're on line detail page
    await expect(page).toHaveURL(/\/lines\/.+/);

    // Click back
    await lineDetailPage.goBack();

    // Verify we're back on lines page
    await expect(page).toHaveURL('/lines');
  });
});
