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
   * Get statistics cards
   */
  getStatCards() {
    return this.page
      .getByRole('article')
      .or(this.page.locator('[class*="stat-card"]'));
  }

  /**
   * Get specific stat by name
   * @param statName - Name of the statistic (e.g., "Total Stations")
   */
  getStat(statName: string) {
    return this.page
      .locator('[class*="stat"]', {
        has: this.page.getByText(new RegExp(statName, 'i')),
      })
      .first();
  }

  /**
   * Get stat value
   * @param statName - Name of the statistic
   */
  async getStatValue(statName: string): Promise<string | null> {
    const stat = this.getStat(statName);
    const text = await stat.textContent();

    if (!text) return null;

    // Try to extract number from text
    const match = text.match(/\d+/);
    return match ? match[0] : null;
  }

  /**
   * Get total stations stat
   */
  async getTotalStations(): Promise<number | null> {
    const value = await this.getStatValue('total stations');
    return value ? Number(value) : null;
  }

  /**
   * Get total lines stat
   */
  async getTotalLines(): Promise<number | null> {
    const value = await this.getStatValue('total lines|active lines');
    return value ? Number(value) : null;
  }

  /**
   * Get usage chart if it exists
   */
  getUsageChart() {
    return this.page
      .locator('[class*="chart"]')
      .or(this.page.getByRole('img', { name: /chart|graph/i }));
  }

  /**
   * Check if charts are displayed
   */
  async hasCharts(): Promise<boolean> {
    return this.getUsageChart().isVisible();
  }
}
