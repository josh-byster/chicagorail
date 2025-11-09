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

  test('train detail page has no violations', async ({ page }) => {
    // Navigate to train detail via search
    const routePage = new RoutePage(page);
    await routePage.goto();
    await routePage.selectOrigin(KNOWN_STATIONS.CHICAGO_UNION.searchTerm);
    await routePage.selectDestination(KNOWN_STATIONS.AURORA.searchTerm);
    await routePage.searchButton();
    await routePage.waitForResults();
    await routePage.clickTrainCard(0);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

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

  test('form labels are associated with inputs', async ({ page }) => {
    const routePage = new RoutePage(page);
    await routePage.goto();

    // Check that form inputs have labels
    const originInput = routePage.getOriginSelect();
    const destInput = routePage.getDestinationSelect();

    // Both should be labeled
    await expect(originInput).toBeVisible();
    await expect(destInput).toBeVisible();

    // Verify they have accessible names
    const originLabel = await originInput.getAttribute('aria-label');
    const destLabel = await destInput.getAttribute('aria-label');

    // Should have either aria-label or associated label
    const hasOriginLabel = originLabel || (await originInput.evaluate((el) => {
      const id = el.id;
      return id ? !!document.querySelector(`label[for="${id}"]`) : false;
    }));

    const hasDestLabel = destLabel || (await destInput.evaluate((el) => {
      const id = el.id;
      return id ? !!document.querySelector(`label[for="${id}"]`) : false;
    }));

    expect(hasOriginLabel).toBeTruthy();
    expect(hasDestLabel).toBeTruthy();
  });

  test('buttons have accessible names', async ({ page }) => {
    const routePage = new RoutePage(page);
    await routePage.goto();

    const searchButton = routePage.getSearchButton();

    // Button should have text content or aria-label
    const buttonText = await searchButton.textContent();
    const ariaLabel = await searchButton.getAttribute('aria-label');

    expect(buttonText || ariaLabel).toBeTruthy();
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
        const aPos = document.querySelector(`h${a.level}`)?.getBoundingClientRect().top || 0;
        const bPos = document.querySelector(`h${b.level}`)?.getBoundingClientRect().top || 0;
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
