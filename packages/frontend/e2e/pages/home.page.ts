import { Page } from '@playwright/test';

/**
 * Page Object Model for Home Page
 */
export class HomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get quick stats section
   */
  getQuickStats() {
    return this.page.getByRole('region', { name: /quick stats|statistics/i });
  }

  /**
   * Get recent searches section
   */
  getRecentSearches() {
    return this.page.getByRole('region', { name: /recent searches/i });
  }

  /**
   * Get nearby stations section
   */
  getNearbyStations() {
    return this.page.getByRole('region', { name: /nearby stations/i });
  }

  /**
   * Click "Find Route" button
   */
  async clickFindRoute() {
    await this.page.getByRole('button', { name: /find route/i }).click();
  }

  /**
   * Click "View Lines" button
   */
  async clickViewLines() {
    await this.page.getByRole('button', { name: /view lines/i }).click();
  }

  /**
   * Click "View Alerts" button
   */
  async clickViewAlerts() {
    await this.page
      .getByRole('button', { name: /view alerts|alerts/i })
      .click();
  }

  /**
   * Open keyboard shortcuts dialog
   */
  async openKeyboardShortcuts() {
    await this.page.keyboard.press('?');
  }

  /**
   * Get keyboard shortcuts dialog
   */
  getKeyboardShortcutsDialog() {
    return this.page.getByRole('dialog', { name: /keyboard shortcuts/i });
  }

  /**
   * Close keyboard shortcuts dialog
   */
  async closeKeyboardShortcuts() {
    await this.page.keyboard.press('Escape');
  }
}
