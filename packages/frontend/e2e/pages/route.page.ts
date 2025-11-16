import { Page } from '@playwright/test';

/**
 * Page Object Model for Route Search
 * Note: Route search happens on the home page (/), not a separate /route page.
 * The /route page only displays results after selection.
 */
export class RoutePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to route search page (home page)
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get origin station search input (Command component)
   */
  getOriginInput() {
    return this.page.getByPlaceholder('Search for a station');
  }

  /**
   * Alias for getOriginInput() for backwards compatibility
   */
  getOriginSelect() {
    return this.getOriginInput();
  }

  /**
   * Get destination station search input (Command component)
   */
  getDestinationInput() {
    return this.page.getByPlaceholder('Search destinations...');
  }

  /**
   * Alias for getDestinationInput() for backwards compatibility
   */
  getDestinationSelect() {
    return this.getDestinationInput();
  }

  /**
   * DEPRECATED: There is no search button - kept for backwards compatibility
   * Returns a dummy locator that will always be visible
   */
  getSearchButton() {
    // Return the body element since there's no actual search button
    return this.page.locator('body');
  }

  /**
   * Get train list container (on /route page after search)
   */
  getTrainList() {
    return this.page.locator('.space-y-4, [role="alert"]');
  }

  /**
   * Get all train cards (on /route page)
   */
  getTrainCards() {
    return this.page.locator('.space-y-3 > div');
  }

  /**
   * Select origin station by typing and clicking
   * @param stationName - Name or partial name of station
   */
  async selectOrigin(stationName: string) {
    const input = this.getOriginInput();

    // Type in the search field
    await input.click();
    await input.fill(stationName);

    // Wait for the dropdown to appear
    await this.page.waitForTimeout(500);

    // Click the matching option (CommandItem)
    const option = this.page
      .getByRole('option', {
        name: new RegExp(stationName, 'i'),
      })
      .first();

    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // Wait for selection to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Select destination station by typing and clicking
   * Note: This automatically navigates to /route page
   * @param stationName - Name or partial name of station
   */
  async selectDestination(stationName: string) {
    const input = this.getDestinationInput();

    // Type in the search field
    await input.click();
    await input.fill(stationName);

    // Wait for the dropdown to appear
    await this.page.waitForTimeout(500);

    // Click the matching option (CommandItem)
    const option = this.page
      .getByRole('option', {
        name: new RegExp(stationName, 'i'),
      })
      .first();

    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();

    // Wait for navigation to /route page
    await this.page.waitForURL(/\/route\?origin=.+&destination=.+/, {
      timeout: 5000,
    });
  }

  /**
   * Perform a complete route search
   * This will navigate from home page to results page
   */
  async searchRoute(params: { origin: string; destination: string }) {
    await this.selectOrigin(params.origin);
    await this.selectDestination(params.destination);
    // Navigation happens automatically - no search button needed
  }

  /**
   * Wait for search results to load (on /route page)
   */
  async waitForResults() {
    // Wait for URL to be /route
    await this.page.waitForURL(/\/route/, { timeout: 5000 });

    // Wait for loading skeletons to disappear
    await this.page
      .locator('[class*="skeleton"]')
      .first()
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {
        // If no skeleton found, that's okay - might have loaded instantly
      });

    // Then wait for either results or error/empty message
    await this.page
      .locator('[role="alert"], .space-y-3')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });
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
   * Get the "Change route" button (on /route page)
   */
  getChangeRouteButton() {
    return this.page.getByRole('button', { name: /change route/i });
  }

  /**
   * Click the "Change route" button to go back to search
   */
  async changeRoute() {
    await this.getChangeRouteButton().click();
    await this.page.waitForURL('/', { timeout: 3000 });
  }

  /**
   * DEPRECATED: There is no separate search button - selection triggers navigation
   */
  async searchButton() {
    // This method is kept for backwards compatibility but does nothing
    // Navigation happens automatically when destination is selected
  }
}
