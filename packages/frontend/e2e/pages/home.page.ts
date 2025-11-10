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
   * Click "Browse Lines" quick action card
   */
  async clickBrowseLines() {
    // Find the card containing "Browse Lines" text and click it
    const card = this.page.locator('div[class*="cursor-pointer"]', {
      has: this.page.getByText('Browse Lines'),
    });
    await card.click();
  }

  /**
   * Click "Service Alerts" quick action card
   */
  async clickServiceAlerts() {
    // Find the card containing "Service Alerts" text and click it
    const card = this.page.locator('div[class*="cursor-pointer"]', {
      has: this.page.getByText('Service Alerts'),
    });
    await card.click();
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
