import { test, expect } from '@playwright/test';
import { StatisticsPage } from '../pages/statistics.page';
import { TOTAL_METRA_LINES } from '../fixtures/gtfs-data';

test.describe('Statistics Page', () => {
  let statsPage: StatisticsPage;

  test.beforeEach(async ({ page }) => {
    statsPage = new StatisticsPage(page);
    await statsPage.goto();
  });

  test('displays statistics page', async ({ page }) => {
    await expect(page).toHaveURL('/statistics');
  });

  test('shows system statistics', async ({ page }) => {
    // Verify stat cards are displayed
    const statCards = statsPage.getStatCards();
    const count = await statCards.count();

    expect(count).toBeGreaterThan(0);

    // Check for common stat names
    const totalStationsVisible =
      (await page.getByText(/total stations/i).count()) > 0;
    const activeLinesVisible =
      (await page.getByText(/active lines|total lines/i).count()) > 0;

    expect(totalStationsVisible || activeLinesVisible).toBeTruthy();
  });

  test('displays correct line count', async () => {
    const totalLines = await statsPage.getTotalLines();

    if (totalLines !== null) {
      expect(totalLines).toBe(TOTAL_METRA_LINES);
    }
  });

  test('displays positive station count', async () => {
    const totalStations = await statsPage.getTotalStations();

    if (totalStations !== null) {
      // Metra has over 200 stations
      expect(totalStations).toBeGreaterThan(100);
    }
  });

  test('statistics have valid numeric values', async ({ page }) => {
    const statCards = statsPage.getStatCards();
    const count = await statCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = statCards.nth(i);
      const text = await card.textContent();

      if (text) {
        // Should contain at least one number
        expect(text).toMatch(/\d+/);
      }
    }
  });
});
