import { Page } from '@playwright/test';

/**
 * Page Object Model for Line Detail Page
 */
export class LineDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to line detail page
   * @param lineId - Line ID (e.g., "BNSF", "UP-N")
   */
  async goto(lineId: string) {
    await this.page.goto(`/lines/${lineId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get line name heading
   */
  getLineName() {
    return this.page.getByRole('heading', { level: 1 }).first();
  }

  /**
   * Get all station cards
   */
  getStationCards() {
    return this.page
      .getByRole('article')
      .or(this.page.locator('[class*="station-card"]'));
  }

  /**
   * Get specific station card
   * @param stationName - Name of the station
   */
  getStationCard(stationName: string) {
    return this.page
      .locator('[class*="station"]', {
        has: this.page.getByText(new RegExp(stationName, 'i')),
      })
      .first();
  }

  /**
   * Click on a station
   * @param stationName - Name of the station
   */
  async clickStation(stationName: string) {
    await this.getStationCard(stationName).click();
  }

  /**
   * Get station count
   */
  async getStationCount(): Promise<number> {
    return this.getStationCards().count();
  }

  /**
   * Get all station names in order
   */
  async getStationNames(): Promise<string[]> {
    const cards = this.getStationCards();
    const count = await cards.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      if (text) {
        // Extract just the station name (may have other info in the card)
        const lines = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          names.push(lines[0]);
        }
      }
    }

    return names;
  }

  /**
   * Get back to lines button
   */
  getBackButton() {
    return this.page
      .getByRole('link', { name: /back|lines/i })
      .or(this.page.getByRole('button', { name: /back|lines/i }));
  }

  /**
   * Go back to lines list
   */
  async goBack() {
    await this.getBackButton().click();
  }
}
