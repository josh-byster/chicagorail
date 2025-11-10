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

  test('quick action buttons navigate correctly', async ({ page }) => {
    // Test "Find Route" button
    await homePage.clickFindRoute();
    await expect(page).toHaveURL('/route');

    // Navigate back
    await homePage.goto();

    // Test "View Lines" button
    await homePage.clickViewLines();
    await expect(page).toHaveURL('/lines');
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

  test('page is responsive', async ({ page: _page }) => {
    // Check that the page renders without errors
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Navigate using keyboard
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });
});
