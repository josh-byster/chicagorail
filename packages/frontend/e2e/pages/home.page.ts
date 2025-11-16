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
   * Click "Lines" navigation button
   */
  async clickBrowseLines() {
    // Click the Lines button in the navigation bar
    await this.page.getByRole('button', { name: /^Lines$/i }).click();
    await this.page.waitForURL('/lines');
  }

  /**
   * Click "Alerts" navigation button
   */
  async clickServiceAlerts() {
    // Click the Alerts button in the navigation bar
    await this.page.getByRole('button', { name: /^Alerts$/i }).click();
    await this.page.waitForURL('/alerts');
  }

  /**
   * Navigate to route search (home page already has route search)
   */
  async navigateToRoute() {
    // Home page already has route search, just use it
    // or navigate to /route if needed
    await this.page.goto('/route');
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
