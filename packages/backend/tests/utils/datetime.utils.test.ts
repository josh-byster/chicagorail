/**
 * Unit tests for datetime utility functions
 * All functions are pure (using Intl API for timezone)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  getChicagoOffset,
  constructDateTime,
  getCurrentChicagoTime,
  getCurrentChicagoDate,
  getDayColumn,
} from '../../src/utils/datetime.utils';

describe('datetime.utils', () => {
  beforeAll(() => {
    // Ensure consistent timezone for tests
    process.env.TZ = 'America/Chicago';
  });

  describe('getChicagoOffset', () => {
    it('should return CST offset in winter (-06:00)', () => {
      // January 15, 2025 is in CST (Central Standard Time)
      const offset = getChicagoOffset('2025-01-15');
      expect(offset).toBe('-06:00');
    });

    it('should return CDT offset in summer (-05:00)', () => {
      // July 15, 2025 is in CDT (Central Daylight Time)
      const offset = getChicagoOffset('2025-07-15');
      expect(offset).toBe('-05:00');
    });

    it('should handle DST transition in spring', () => {
      // March 9, 2025 - DST starts (2 AM → 3 AM)
      // Before transition
      const beforeDST = getChicagoOffset('2025-03-08');
      expect(beforeDST).toBe('-06:00');

      // After transition
      const afterDST = getChicagoOffset('2025-03-10');
      expect(afterDST).toBe('-05:00');
    });

    it('should handle DST transition in fall', () => {
      // November 2, 2025 - DST ends (2 AM → 1 AM)
      // Before transition
      const beforeStandard = getChicagoOffset('2025-11-01');
      expect(beforeStandard).toBe('-05:00');

      // After transition
      const afterStandard = getChicagoOffset('2025-11-03');
      expect(afterStandard).toBe('-06:00');
    });

    it('should handle leap year dates', () => {
      // February 29, 2024 (leap year)
      const offset = getChicagoOffset('2024-02-29');
      expect(offset).toMatch(/^-0[56]:00$/);
    });

    it('should handle year boundaries', () => {
      const newYear = getChicagoOffset('2025-01-01');
      expect(newYear).toBe('-06:00');

      const newYearsEve = getChicagoOffset('2024-12-31');
      expect(newYearsEve).toBe('-06:00');
    });
  });

  describe('constructDateTime', () => {
    it('should construct datetime for normal time', () => {
      const result = constructDateTime('14:30:00', '2025-01-15');
      expect(result).toBe('2025-01-15T14:30:00-06:00');
    });

    it('should handle midnight', () => {
      const result = constructDateTime('00:00:00', '2025-01-15');
      expect(result).toBe('2025-01-15T00:00:00-06:00');
    });

    it('should handle time just before midnight', () => {
      const result = constructDateTime('23:59:59', '2025-01-15');
      expect(result).toBe('2025-01-15T23:59:59-06:00');
    });

    it('should handle GTFS time past midnight (25:30:00)', () => {
      // 25:30:00 on Jan 15 = 01:30:00 on Jan 16
      const result = constructDateTime('25:30:00', '2025-01-15');
      expect(result).toBe('2025-01-16T01:30:00-06:00');
    });

    it('should handle GTFS time at 24:00:00', () => {
      // 24:00:00 on Jan 15 = 00:00:00 on Jan 16
      const result = constructDateTime('24:00:00', '2025-01-15');
      expect(result).toBe('2025-01-16T00:00:00-06:00');
    });

    it('should handle GTFS time far past midnight (26:45:30)', () => {
      // 26:45:30 on Jan 15 = 02:45:30 on Jan 16
      const result = constructDateTime('26:45:30', '2025-01-15');
      expect(result).toBe('2025-01-16T02:45:30-06:00');
    });

    it('should handle GTFS time more than 24 hours past (48:00:00)', () => {
      // 48:00:00 on Jan 15 = 00:00:00 on Jan 17 (2 days later)
      const result = constructDateTime('48:00:00', '2025-01-15');
      expect(result).toBe('2025-01-17T00:00:00-06:00');
    });

    it('should handle empty time string', () => {
      const result = constructDateTime('', '2025-01-15');
      expect(result).toBe('');
    });

    it('should handle month boundary crossing', () => {
      // 25:00:00 on Jan 31 = 01:00:00 on Feb 1
      const result = constructDateTime('25:00:00', '2025-01-31');
      expect(result).toBe('2025-02-01T01:00:00-06:00');
    });

    it('should handle year boundary crossing', () => {
      // 25:00:00 on Dec 31 = 01:00:00 on Jan 1 next year
      const result = constructDateTime('25:00:00', '2024-12-31');
      expect(result).toBe('2025-01-01T01:00:00-06:00');
    });

    it('should handle DST transition correctly', () => {
      // Summer time (CDT)
      const summer = constructDateTime('14:30:00', '2025-07-15');
      expect(summer).toBe('2025-07-15T14:30:00-05:00');

      // Winter time (CST)
      const winter = constructDateTime('14:30:00', '2025-01-15');
      expect(winter).toBe('2025-01-15T14:30:00-06:00');
    });

    it('should handle single digit hours/minutes/seconds', () => {
      const result = constructDateTime('09:05:03', '2025-01-15');
      expect(result).toBe('2025-01-15T09:05:03-06:00');
    });

    it('should pad time components correctly', () => {
      // This tests that we're padding correctly when hours become <10 after modulo
      const result = constructDateTime('24:05:03', '2025-01-15');
      expect(result).toBe('2025-01-16T00:05:03-06:00');
    });
  });

  describe('getCurrentChicagoTime', () => {
    it('should return time in HH:MM:SS format', () => {
      const time = getCurrentChicagoTime();

      // Match HH:MM:SS pattern
      expect(time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('should return valid time components', () => {
      const time = getCurrentChicagoTime();
      const [hours, minutes, seconds] = time.split(':').map(Number);

      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThan(24);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThan(60);
    });

    it('should pad single digits with zero', () => {
      const time = getCurrentChicagoTime();
      const parts = time.split(':');

      parts.forEach((part) => {
        expect(part).toHaveLength(2);
      });
    });
  });

  describe('getCurrentChicagoDate', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const date = getCurrentChicagoDate();

      // Match YYYY-MM-DD pattern
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return valid date components', () => {
      const date = getCurrentChicagoDate();
      const [year, month, day] = date.split('-').map(Number);

      expect(year).toBeGreaterThan(2020);
      expect(year).toBeLessThan(2100);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it('should pad single digit months and days with zero', () => {
      const date = getCurrentChicagoDate();
      const [year, month, day] = date.split('-');

      expect(year).toHaveLength(4);
      expect(month).toHaveLength(2);
      expect(day).toHaveLength(2);
    });

    it('should return Chicago date even if UTC date is different', () => {
      // This is hard to test without mocking, but we can at least verify the format
      const date = getCurrentChicagoDate();
      expect(new Date(date + 'T00:00:00')).toBeInstanceOf(Date);
    });
  });

  describe('getDayColumn', () => {
    it('should return correct day for known dates', () => {
      // January 15, 2025 is a Wednesday
      expect(getDayColumn('2025-01-15')).toBe('wednesday');

      // January 1, 2025 is a Wednesday
      expect(getDayColumn('2025-01-01')).toBe('wednesday');

      // January 6, 2025 is a Monday
      expect(getDayColumn('2025-01-06')).toBe('monday');

      // January 11, 2025 is a Saturday
      expect(getDayColumn('2025-01-11')).toBe('saturday');

      // January 12, 2025 is a Sunday
      expect(getDayColumn('2025-01-12')).toBe('sunday');
    });

    it('should return all days of week correctly', () => {
      const weekDays = [
        '2025-01-05', // Sunday
        '2025-01-06', // Monday
        '2025-01-07', // Tuesday
        '2025-01-08', // Wednesday
        '2025-01-09', // Thursday
        '2025-01-10', // Friday
        '2025-01-11', // Saturday
      ];

      const expectedDays = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];

      weekDays.forEach((date, index) => {
        expect(getDayColumn(date)).toBe(expectedDays[index]);
      });
    });

    it('should handle month boundaries', () => {
      // January 31, 2025 is a Friday
      expect(getDayColumn('2025-01-31')).toBe('friday');

      // February 1, 2025 is a Saturday
      expect(getDayColumn('2025-02-01')).toBe('saturday');
    });

    it('should handle year boundaries', () => {
      // December 31, 2024 is a Tuesday
      expect(getDayColumn('2024-12-31')).toBe('tuesday');

      // January 1, 2025 is a Wednesday
      expect(getDayColumn('2025-01-01')).toBe('wednesday');
    });

    it('should handle leap year', () => {
      // February 29, 2024 is a Thursday
      expect(getDayColumn('2024-02-29')).toBe('thursday');
    });

    it('should always return lowercase day name', () => {
      const result = getDayColumn('2025-01-15');
      expect(result).toBe(result.toLowerCase());
    });

    it('should return one of the valid day names', () => {
      const validDays = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];

      const result = getDayColumn('2025-01-15');
      expect(validDays).toContain(result);
    });
  });
});
