import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
export const GTFS_FIXTURES_DIR = path.join(FIXTURES_DIR, 'gtfs');

/**
 * Get the path to a GTFS fixture file
 */
export function getFixturePath(filename: string): string {
  return path.join(GTFS_FIXTURES_DIR, filename);
}

/**
 * Read a GTFS fixture file
 */
export function readFixture(filename: string): string {
  return fs.readFileSync(getFixturePath(filename), 'utf-8');
}

/**
 * Parse CSV fixture file into objects
 */
export function parseCSVFixture<T>(
  filename: string,
  rowMapper: (row: Record<string, string>) => T
): T[] {
  const content = readFixture(filename);
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines
    .slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',');
      const row = headers.reduce((obj, header, index) => {
        obj[header] = values[index]?.trim() || '';
        return obj;
      }, {} as Record<string, string>);
      return rowMapper(row);
    });
}

/**
 * Mock date for consistent testing
 */
export function mockDate(dateString: string): jest.SpyInstance {
  const mockDate = new Date(dateString);
  return jest.spyOn(global, 'Date').mockImplementation((() => mockDate) as any);
}

/**
 * Restore mocked date
 */
export function restoreDate(spy: jest.SpyInstance): void {
  spy.mockRestore();
}

/**
 * Create a test date for GTFS service period testing
 * Default to a weekday within typical service periods
 */
export function createTestDate(overrides?: {
  year?: number;
  month?: number;
  day?: number;
}): Date {
  const defaults = {
    year: 2024,
    month: 11, // December (0-indexed)
    day: 14, // Saturday
  };
  const { year, month, day } = { ...defaults, ...overrides };
  return new Date(year, month, day);
}
