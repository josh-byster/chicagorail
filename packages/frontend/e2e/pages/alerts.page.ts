import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Alerts Page
 */
export class AlertsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to alerts page
   */
  async goto() {
    await this.page.goto('/alerts');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all alert cards
   */
  getAlertCards() {
    return this.page.getByRole('article').or(
      this.page.locator('[class*="alert-card"]')
    );
  }

  /**
   * Get no alerts message
   */
  getNoAlertsMessage() {
    return this.page.getByText(/no active alerts|no alerts/i);
  }

  /**
   * Get line filter dropdown
   */
  getLineFilter() {
    return this.page.getByLabel(/filter.*line|line filter/i);
  }

  /**
   * Get station filter dropdown
   */
  getStationFilter() {
    return this.page.getByLabel(/filter.*station|station filter/i);
  }

  /**
   * Filter alerts by line
   * @param lineName - Name of the line
   */
  async filterByLine(lineName: string) {
    await this.getLineFilter().click();
    await this.page.getByRole('option', { name: new RegExp(lineName, 'i') }).click();
  }

  /**
   * Filter alerts by station
   * @param stationName - Name of the station
   */
  async filterByStation(stationName: string) {
    await this.getStationFilter().click();
    await this.page.getByRole('option', { name: new RegExp(stationName, 'i') }).click();
  }

  /**
   * Get alert count
   */
  async getAlertCount(): Promise<number> {
    return this.getAlertCards().count();
  }

  /**
   * Check if there are any alerts
   */
  async hasAlerts(): Promise<boolean> {
    return (await this.getAlertCount()) > 0;
  }
}
