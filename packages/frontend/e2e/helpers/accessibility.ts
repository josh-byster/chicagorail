import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility testing helper functions
 */

/**
 * Run accessibility scan on current page
 * @param page - Playwright page object
 * @param options - Optional axe configuration
 */
export async function checkAccessibility(
  page: Page,
  options?: {
    excludeSelectors?: string[];
    includeTags?: string[];
  }
) {
  const builder = new AxeBuilder({ page });

  // Default to WCAG 2.1 Level AA
  if (!options?.includeTags) {
    builder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  } else {
    builder.withTags(options.includeTags);
  }

  // Exclude specific selectors if provided
  if (options?.excludeSelectors) {
    options.excludeSelectors.forEach((selector) => {
      builder.exclude(selector);
    });
  }

  const results = await builder.analyze();

  // Log violations if any
  if (results.violations.length > 0) {
    console.error('Accessibility violations found:');
    results.violations.forEach((violation) => {
      console.error(`\n- ${violation.id}: ${violation.description}`);
      console.error(`  Impact: ${violation.impact}`);
      console.error(`  Help: ${violation.helpUrl}`);
      violation.nodes.forEach((node) => {
        console.error(`  Element: ${node.html}`);
        console.error(`  Target: ${node.target.join(', ')}`);
      });
    });
  }

  return results;
}

/**
 * Assert no accessibility violations
 */
export async function expectNoAccessibilityViolations(
  page: Page,
  options?: {
    excludeSelectors?: string[];
    includeTags?: string[];
  }
) {
  const results = await checkAccessibility(page, options);
  expect(results.violations).toEqual([]);
}

/**
 * Check keyboard navigation works
 */
export async function checkKeyboardNavigation(page: Page) {
  // Press Tab multiple times and verify focus is visible
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');

    // Verify an element has focus
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        type: el?.getAttribute('type'),
        role: el?.getAttribute('role'),
      };
    });

    // Focused element should be an interactive element
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const hasInteractiveRole = [
      'button',
      'link',
      'textbox',
      'combobox',
    ].includes(focusedElement.role || '');

    expect(
      interactiveTags.includes(focusedElement.tagName || '') ||
        hasInteractiveRole
    ).toBeTruthy();
  }
}

/**
 * Check skip to main content link
 */
export async function checkSkipLink(page: Page) {
  // Focus skip link (usually first interactive element)
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: /skip to (main|content)/i });
  if (await skipLink.isVisible()) {
    await skipLink.click();

    // Main content should be focused
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeFocused();
  }
}
