import { Page } from '@playwright/test';

/**
 * Page Object Model for Route Search Page
 */
export class RoutePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to route search page
   */
  async goto() {
    await this.page.goto('/route');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get origin station select/combobox
   */
  getOriginSelect() {
    return this.page.getByLabel(/from|origin/i).first();
  }

  /**
   * Get destination station select/combobox
   */
  getDestinationSelect() {
    return this.page.getByLabel(/to|destination/i).first();
  }

  /**
   * Get departure time input
   */
  getDepartureTimeInput() {
    return this.page.getByLabel(/departure time|time/i);
  }

  /**
   * Get departure date input
   */
  getDepartureDateInput() {
    return this.page.getByLabel(/date/i);
  }

  /**
   * Get search button
   */
  getSearchButton() {
    return this.page.getByRole('button', { name: /search|find trains/i });
  }

  /**
   * Get save route button
   */
  getSaveRouteButton() {
    return this.page.getByRole('button', { name: /save route/i });
  }

  /**
   * Get train list container
   */
  getTrainList() {
    return this.page
      .getByRole('list', { name: /trains|results/i })
      .or(this.page.locator('[class*="train-list"]'));
  }

  /**
   * Get all train cards
   */
  getTrainCards() {
    return this.page
      .getByRole('article')
      .or(this.page.locator('[class*="train-card"]'));
  }

  /**
   * Get saved routes section
   */
  getSavedRoutes() {
    return this.page.getByRole('region', { name: /saved routes/i });
  }

  /**
   * Select origin station
   * @param stationName - Name or partial name of station
   */
  async selectOrigin(stationName: string) {
    const select = this.getOriginSelect();
    await select.click();

    // Wait for dropdown to open
    await this.page.waitForTimeout(500);

    // Find and click the option
    const option = this.page
      .getByRole('option', {
        name: new RegExp(stationName, 'i'),
      })
      .first();
    await option.click();

    // Wait for selection to register
    await this.page.waitForTimeout(300);
  }

  /**
   * Select destination station
   * @param stationName - Name or partial name of station
   */
  async selectDestination(stationName: string) {
    const select = this.getDestinationSelect();
    await select.click();

    // Wait for dropdown to open
    await this.page.waitForTimeout(500);

    // Find and click the option
    const option = this.page
      .getByRole('option', {
        name: new RegExp(stationName, 'i'),
      })
      .first();
    await option.click();

    // Wait for selection to register
    await this.page.waitForTimeout(300);
  }

  /**
   * Set departure time
   * @param time - Time in HH:mm format (e.g., "14:30")
   */
  async setDepartureTime(time: string) {
    await this.getDepartureTimeInput().fill(time);
  }

  /**
   * Set departure date
   * @param date - Date in YYYY-MM-DD format
   */
  async setDepartureDate(date: string) {
    await this.getDepartureDateInput().fill(date);
  }

  /**
   * Perform a complete route search
   */
  async searchRoute(params: {
    origin: string;
    destination: string;
    time?: string;
    date?: string;
  }) {
    await this.selectOrigin(params.origin);
    await this.selectDestination(params.destination);

    if (params.time) {
      await this.setDepartureTime(params.time);
    }

    if (params.date) {
      await this.setDepartureDate(params.date);
    }

    await this.searchButton();
  }

  /**
   * Click search button
   */
  async searchButton() {
    await this.getSearchButton().click();
  }

  /**
   * Wait for search results to load
   */
  async waitForResults() {
    await this.getTrainList().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Click on a specific train card
   * @param index - Index of the train card (0-based)
   */
  async clickTrainCard(index: number = 0) {
    const cards = this.getTrainCards();
    await cards.nth(index).click();
  }

  /**
   * Save current route
   * @param routeName - Name for the saved route
   */
  async saveRoute(routeName: string) {
    await this.getSaveRouteButton().click();

    // Fill in route name in dialog
    await this.page.getByLabel(/route name|name/i).fill(routeName);

    // Click save in dialog
    await this.page.getByRole('button', { name: /^save$/i }).click();
  }

  /**
   * Click on a saved route
   * @param routeName - Name of the saved route
   */
  async clickSavedRoute(routeName: string) {
    await this.page.getByText(routeName).click();
  }

  /**
   * Delete a saved route
   * @param routeName - Name of the saved route
   */
  async deleteSavedRoute(routeName: string) {
    const routeCard = this.page.locator(`[class*="saved-route"]`, {
      has: this.page.getByText(routeName),
    });

    await routeCard.getByRole('button', { name: /delete|remove/i }).click();

    // Confirm deletion if dialog appears
    const confirmButton = this.page.getByRole('button', {
      name: /confirm|yes|delete/i,
    });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }
}
