import { Page } from '@playwright/test';

/**
 * Page Object Model for Statistics Page
 */
export class StatisticsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to statistics page
   */
  async goto() {
    await this.page.goto('/statistics');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if page shows "No Statistics Yet" message
   */
  async hasNoData(): Promise<boolean> {
    return this.page.getByText('No Statistics Yet').isVisible();
  }

  /**
   * Get "Total Trips" value
   */
  async getTotalTrips(): Promise<number | null> {
    const card = this.page.getByText('Total Trips').locator('..').locator('..');
    const value = await card.getByText(/^\d+$/).textContent();
    return value ? Number(value) : null;
  }

  /**
   * Get "Days Active" value
   */
  async getDaysActive(): Promise<number | null> {
    const card = this.page.getByText('Days Active').locator('..').locator('..');
    const value = await card.getByText(/^\d+$/).textContent();
    return value ? Number(value) : null;
  }

  /**
   * Get "Recent Activity" value
   */
  async getRecentActivity(): Promise<number | null> {
    const card = this.page
      .getByText('Recent Activity')
      .locator('..')
      .locator('..');
    const value = await card.getByText(/^\d+$/).textContent();
    return value ? Number(value) : null;
  }

  /**
   * Get Most Used Route card
   */
  getMostUsedRoute() {
    return this.page.getByText('Most Used Route').locator('..').locator('..');
  }

  /**
   * Get Top Stations section
   */
  getTopStations() {
    return this.page.getByText('Top Stations').locator('..').locator('..');
  }

  /**
   * Get Top Lines section
   */
  getTopLines() {
    return this.page.getByText('Most Used Lines').locator('..').locator('..');
  }

  /**
   * Get Activity by Day section
   */
  getActivityByDay() {
    return this.page.getByText('Activity by Day').locator('..').locator('..');
  }

  /**
   * Check if charts/graphs are displayed
   */
  async hasCharts(): Promise<boolean> {
    // The activity by day section has progress bars (visual charts)
    const activitySection = this.page.getByText('Activity by Day');
    return activitySection.isVisible();
  }

  /**
   * Get all stat cards (overview cards)
   */
  getStatCards() {
    // The overview cards grid
    return this.page.locator('.grid.grid-cols-1.md\\:grid-cols-3 > div');
  }
}
