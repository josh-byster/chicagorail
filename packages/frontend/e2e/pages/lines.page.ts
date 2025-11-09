import { Page, Locator } from '@playwright/test';

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
   * Get all line cards
   */
  getLineCards() {
    return this.page.getByRole('article').or(
      this.page.locator('[class*="line-card"]')
    );
  }

  /**
   * Get specific line card by name
   * @param lineName - Name of the line (e.g., "BNSF", "Union Pacific North")
   */
  getLineCard(lineName: string) {
    return this.page.locator('[class*="line"]', {
      has: this.page.getByText(new RegExp(lineName, 'i')),
    }).first();
  }

  /**
   * Get line status for a specific line
   * @param lineName - Name of the line
   */
  getLineStatus(lineName: string) {
    const card = this.getLineCard(lineName);
    return card.locator('[class*="status"]').or(
      card.getByRole('status')
    );
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
