import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('displays the home page', async () => {
    await expect(homePage.page).toHaveTitle(/metra|train|chicago/i);
  });

  test('quick action cards navigate correctly', async ({ page }) => {
    // Test "Browse Lines" card
    await homePage.clickBrowseLines();
    await expect(page).toHaveURL('/lines');

    // Navigate back
    await homePage.goto();

    // Test "Service Alerts" card
    await homePage.clickServiceAlerts();
    await expect(page).toHaveURL('/alerts');
  });

  test('keyboard shortcuts dialog opens and closes', async ({
    page: _page,
  }) => {
    // Open with "?"
    await homePage.openKeyboardShortcuts();

    const dialog = homePage.getKeyboardShortcutsDialog();
    await expect(dialog).toBeVisible();

    // Close with Escape
    await homePage.closeKeyboardShortcuts();
    await expect(dialog).not.toBeVisible();
  });

  test('page is responsive', async () => {
    // Check that the page renders without errors
    const body = homePage.page.locator('body');
    await expect(body).toBeVisible();

    // Navigate using keyboard
    await homePage.page.keyboard.press('Tab');
    const focusedElement = await homePage.page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });
});
