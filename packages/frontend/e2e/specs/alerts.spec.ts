import { test, expect } from '@playwright/test';
import { AlertsPage } from '../pages/alerts.page';

test.describe('Alerts Page', () => {
  let alertsPage: AlertsPage;

  test.beforeEach(async ({ page }) => {
    alertsPage = new AlertsPage(page);
    await alertsPage.goto();
  });

  test('displays alerts page', async ({ page }) => {
    await expect(page).toHaveURL('/alerts');
  });

  test('shows message when no alerts available', async () => {
    // Since realtime is disabled in tests, alerts should be empty
    const noAlertsMessage = alertsPage.getNoAlertsMessage();

    // Either no alerts message is shown, or no alert cards exist
    const hasAlerts = await alertsPage.hasAlerts();

    if (!hasAlerts) {
      await expect(noAlertsMessage).toBeVisible();
    }
  });

  test('has filter controls', async () => {
    // Verify filter controls exist (even if no alerts)
    const lineFilter = alertsPage.getLineFilter();
    const stationFilter = alertsPage.getStationFilter();

    // At least one filter should be visible
    const lineFilterVisible = await lineFilter.isVisible();
    const stationFilterVisible = await stationFilter.isVisible();

    expect(lineFilterVisible || stationFilterVisible).toBeTruthy();
  });
});
