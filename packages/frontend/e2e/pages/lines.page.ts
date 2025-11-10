import { Page } from '@playwright/test';

/**
 * Page Object Model for Lines Page
 */
export class LinesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to lines page
   */
  async goto() {
    await this.page.goto('/lines');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get all line cards (they're in a grid)
   */
  getLineCards() {
    // Cards are in .grid.grid-cols-1 container
    return this.page.locator(
      '.grid.grid-cols-1 > div[class*="cursor-pointer"]'
    );
  }

  /**
   * Get specific line card by name
   * @param lineName - Name of the line (e.g., "BNSF", "Union Pacific North")
   */
  getLineCard(lineName: string) {
    // Look for the card that contains the line name
    return this.page
      .locator('div[class*="cursor-pointer"]', {
        has: this.page.getByText(lineName, { exact: false }),
      })
      .first();
  }

  /**
   * Get line status for a specific line
   * @param lineName - Name of the line
   */
  getLineStatus(lineName: string) {
    const card = this.getLineCard(lineName);
    return card.locator('[class*="status"]').or(card.getByRole('status'));
  }

  /**
   * Click on a line to view details
   * @param lineName - Name of the line
   */
  async clickLine(lineName: string) {
    await this.getLineCard(lineName).click();
  }

  /**
   * Get count of total lines displayed
   */
  async getLineCount(): Promise<number> {
    return this.getLineCards().count();
  }

  /**
   * Get all line names
   */
  async getAllLineNames(): Promise<string[]> {
    const cards = this.getLineCards();
    const count = await cards.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      if (text) {
        names.push(text.trim());
      }
    }

    return names;
  }
}
