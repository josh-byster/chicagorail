import { Page } from '@playwright/test';

/**
 * Navigation helper functions for E2E tests
 */

/**
 * Navigate to home page and wait for it to load
 */
export async function navigateToHome(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to route search page
 */
export async function navigateToRouteSearch(page: Page) {
  await page.goto('/route');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to lines page
 */
export async function navigateToLines(page: Page) {
  await page.goto('/lines');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to alerts page
 */
export async function navigateToAlerts(page: Page) {
  await page.goto('/alerts');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to statistics page
 */
export async function navigateToStatistics(page: Page) {
  await page.goto('/statistics');
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for API call to complete
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp
) {
  return page.waitForResponse((response) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

/**
 * Wait for multiple API calls to complete
 */
export async function waitForMultipleApiResponses(
  page: Page,
  urlPatterns: (string | RegExp)[]
) {
  return Promise.all(
    urlPatterns.map((pattern) => waitForApiResponse(page, pattern))
  );
}
