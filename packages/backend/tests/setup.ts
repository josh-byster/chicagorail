/**
 * Vitest setup file for backend tests
 * Runs before all tests
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { clearCache } from '../src/services/cache.service';

// Clean up cache between tests
afterEach(() => {
  clearCache();
});

// Setup before all tests
beforeAll(() => {
  // Set timezone to Chicago for consistent datetime testing
  process.env.TZ = 'America/Chicago';
});

// Cleanup after all tests
afterAll(() => {
  clearCache();
});
