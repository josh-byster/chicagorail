import { Page } from '@playwright/test';

/**
 * Page Object Model for Train Detail Page
 */
export class TrainDetailPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to train detail page
   * @param tripId - Trip ID
   */
  async goto(tripId: string) {
    await this.page.goto(`/train/${tripId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get train number/ID display
   */
  getTrainNumber() {
    return this.page.getByRole('heading', { name: /train|trip/i }).first();
  }

  /**
   * Get line name display
   */
  getLineName() {
    return this.page
      .locator('[class*="line-name"]')
      .or(
        this.page
          .getByText(
            /BNSF|Union Pacific|Rock Island|Metra Electric|Milwaukee|Heritage|North Central|Southwest/i
          )
          .first()
      );
  }

  /**
   * Get all stop cards
   */
  getStopCards() {
    return this.page
      .getByRole('listitem')
      .or(this.page.locator('[class*="stop-card"]'));
  }

  /**
   * Get specific stop by station name
   * @param stationName - Name of the station
   */
  getStopByStation(stationName: string) {
    return this.page
      .locator('[class*="stop"]', {
        has: this.page.getByText(new RegExp(stationName, 'i')),
      })
      .first();
  }

  /**
   * Get origin stop (highlighted)
   */
  getOriginStop() {
    return this.page
      .locator('[class*="origin"]')
      .or(this.page.locator('[class*="stop"][class*="highlight"]').first());
  }

  /**
   * Get destination stop (highlighted)
   */
  getDestinationStop() {
    return this.page
      .locator('[class*="destination"]')
      .or(this.page.locator('[class*="stop"][class*="highlight"]').last());
  }

  /**
   * Get map visualization container
   */
  getMapVisualization() {
    return this.page
      .locator('[class*="map"]')
      .or(this.page.getByRole('region', { name: /map/i }));
  }

  /**
   * Get back button/link
   */
  getBackButton() {
    return this.page
      .getByRole('link', { name: /back|return/i })
      .or(this.page.getByRole('button', { name: /back|return/i }));
  }

  /**
   * Click back button to return to search
   */
  async goBack() {
    await this.getBackButton().click();
  }

  /**
   * Get departure time for a specific stop
   * @param stationName - Name of the station
   */
  async getDepartureTime(stationName: string) {
    const stop = this.getStopByStation(stationName);
    const timeElement = stop
      .locator('[class*="time"]')
      .or(stop.getByText(/\d{1,2}:\d{2}\s*(AM|PM)?/i));
    return timeElement.textContent();
  }

  /**
   * Verify stop sequence is correct
   */
  async getStopSequence(): Promise<string[]> {
    const stops = this.getStopCards();
    const count = await stops.count();
    const sequence: string[] = [];

    for (let i = 0; i < count; i++) {
      const stopText = await stops.nth(i).textContent();
      if (stopText) {
        sequence.push(stopText.trim());
      }
    }

    return sequence;
  }
}
