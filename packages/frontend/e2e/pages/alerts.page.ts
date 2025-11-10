import { Page } from '@playwright/test';

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
    return this.page
      .getByRole('article')
      .or(this.page.locator('[class*="alert-card"]'));
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
    // Find the select with "Line" label
    return this.page.getByRole('combobox').first();
  }

  /**
   * Get severity filter dropdown
   */
  getSeverityFilter() {
    // The second combobox is severity
    return this.page.getByRole('combobox').nth(1);
  }

  /**
   * Filter alerts by line
   * @param lineName - Name of the line
   */
  async filterByLine(lineName: string) {
    await this.getLineFilter().click();
    await this.page
      .getByRole('option', { name: new RegExp(lineName, 'i') })
      .click();
  }

  /**
   * Filter alerts by station
   * @param stationName - Name of the station
   */
  async filterByStation(stationName: string) {
    await this.getStationFilter().click();
    await this.page
      .getByRole('option', { name: new RegExp(stationName, 'i') })
      .click();
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
