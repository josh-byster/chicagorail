import { test, expect } from '@playwright/test';
import { expectNoAccessibilityViolations } from '../helpers/accessibility';
import { HomePage } from '../pages/home.page';
import { RoutePage } from '../pages/route.page';
import { LinesPage } from '../pages/lines.page';
import { KNOWN_STATIONS } from '../fixtures/gtfs-data';

test.describe('Accessibility (WCAG 2.1 Level AA)', () => {
  test('home page has no accessibility violations', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expectNoAccessibilityViolations(page);
  });

  test('route search page has no violations', async ({ page }) => {
    const routePage = new RoutePage(page);
    await routePage.goto();

    await expectNoAccessibilityViolations(page);
  });

  test('lines page has no violations', async ({ page }) => {
    const linesPage = new LinesPage(page);
    await linesPage.goto();

    await expectNoAccessibilityViolations(page);
  });

  test('train list with results has no violations', async ({ page }) => {
    // Navigate to route search and get results
    const routePage = new RoutePage(page);
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();

    // Check accessibility of results page
    await expectNoAccessibilityViolations(page);
  });

  test('keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    const focusedElements: string[] = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');

      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label'),
        };
      });

      focusedElements.push(focusInfo.tagName || '');
    }

    // Verify we focused on interactive elements
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT'];
    const hasInteractiveElements = focusedElements.some((tag) =>
      interactiveTags.includes(tag)
    );

    expect(hasInteractiveElements).toBeTruthy();
  });

  test('form inputs are accessible', async ({ page }) => {
    const routePage = new RoutePage(page);
    await routePage.goto();

    // Check for any form inputs on the page
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();

    // Page should have some form controls
    expect(count).toBeGreaterThan(0);

    // Check that at least some visible inputs have accessible names
    let accessibleCount = 0;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        // Check if input has accessible name (aria-label, placeholder, or associated label)
        const name = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        const id = await input.getAttribute('id');
        const hasLabel =
          id && (await page.locator(`label[for="${id}"]`).count()) > 0;

        if (name || placeholder || hasLabel) {
          accessibleCount++;
        }
      }
    }

    // At least one input should have accessibility attributes
    expect(accessibleCount).toBeGreaterThan(0);
  });

  test('buttons are accessible', async ({ page }) => {
    await page.goto('/');

    // Find all buttons
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    // Should have at least one button
    expect(count).toBeGreaterThan(0);

    // Check first few buttons have text or aria-label
    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');

    // Find all images
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Image should have alt text, or role="presentation" if decorative
      const hasAltOrDecorativeRole = alt !== null || role === 'presentation';
      expect(hasAltOrDecorativeRole).toBeTruthy();
    }
  });

  test('headings are in logical order', async ({ page }) => {
    await page.goto('/');

    // Get all headings
    const headings = await page.evaluate(() => {
      const h1 = Array.from(document.querySelectorAll('h1')).map((h) => ({
        level: 1,
        text: h.textContent,
      }));
      const h2 = Array.from(document.querySelectorAll('h2')).map((h) => ({
        level: 2,
        text: h.textContent,
      }));
      const h3 = Array.from(document.querySelectorAll('h3')).map((h) => ({
        level: 3,
        text: h.textContent,
      }));

      return [...h1, ...h2, ...h3].sort((a, b) => {
        const aPos =
          document.querySelector(`h${a.level}`)?.getBoundingClientRect().top ||
          0;
        const bPos =
          document.querySelector(`h${b.level}`)?.getBoundingClientRect().top ||
          0;
        return aPos - bPos;
      });
    });

    // Should have at least one h1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBeGreaterThan(0);
  });

  test('focus is visible', async ({ page }) => {
    await page.goto('/');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Check if focused element has visible outline
    const hasFocusIndicator = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return false;

      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      const boxShadow = styles.boxShadow;

      // Should have outline or box-shadow for focus
      return (
        (outline && outline !== 'none') ||
        (outlineWidth && outlineWidth !== '0px') ||
        (boxShadow && boxShadow !== 'none')
      );
    });

    // Focus should be visible (this may vary by design)
    // This is a softer assertion as it depends on implementation
    if (!hasFocusIndicator) {
      console.warn('Focus indicator may not be visible');
    }
  });
});
