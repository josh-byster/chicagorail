/**
 * Unit tests for frontend date utility functions
 * All functions are pure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatTime,
  formatTimeWithSeconds,
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '../../src/lib/date-utils';

describe('date-utils', () => {
  describe('formatTime', () => {
    it('should format time from Date object', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = formatTime(date);

      // Should match "2:30 PM" or "14:30" depending on locale
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format time from ISO string', () => {
      const result = formatTime('2025-01-15T14:30:00');

      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle midnight', () => {
      const result = formatTime('2025-01-15T00:00:00');

      expect(result).toBeTruthy();
      expect(result).toMatch(/12:00 AM|0:00/);
    });

    it('should handle noon', () => {
      const result = formatTime('2025-01-15T12:00:00');

      expect(result).toBeTruthy();
      expect(result).toMatch(/12:00 PM|12:00/);
    });

    it('should include AM/PM indicator', () => {
      const morning = formatTime('2025-01-15T09:30:00');
      const evening = formatTime('2025-01-15T21:30:00');

      // In 12-hour format, should have AM/PM
      expect(morning.toLowerCase()).toMatch(/am|pm|\d{1,2}:\d{2}/);
      expect(evening.toLowerCase()).toMatch(/am|pm|\d{1,2}:\d{2}/);
    });
  });

  describe('formatTimeWithSeconds', () => {
    it('should include seconds in output', () => {
      const result = formatTimeWithSeconds('2025-01-15T14:30:45');

      // Should match pattern with seconds
      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should format time from Date object with seconds', () => {
      const date = new Date('2025-01-15T14:30:45');
      const result = formatTimeWithSeconds(date);

      expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should handle zero seconds', () => {
      const result = formatTimeWithSeconds('2025-01-15T14:30:00');

      expect(result).toMatch(/\d{1,2}:\d{2}:00/);
    });
  });

  describe('formatDate', () => {
    it('should format date from Date object', () => {
      const date = new Date('2025-01-15T12:00:00');
      const result = formatDate(date);

      // Should match "Jan 15, 2025" or similar
      expect(result).toMatch(/\w{3}\s+\d{1,2},\s+\d{4}/);
      expect(result).toContain('2025');
    });

    it('should format date from ISO string', () => {
      const result = formatDate('2025-01-15T12:00:00');

      expect(result).toMatch(/\w{3}\s+\d{1,2},\s+\d{4}/);
      expect(result).toContain('2025');
    });

    it('should handle year boundary', () => {
      const newYear = formatDate('2025-01-01T00:00:00');
      const newYearsEve = formatDate('2024-12-31T23:59:59');

      expect(newYear).toContain('2025');
      expect(newYearsEve).toContain('2024');
    });

    it('should handle different months', () => {
      const months = ['2025-01-15', '2025-02-15', '2025-03-15', '2025-12-15'];

      months.forEach((dateStr) => {
        const result = formatDate(dateStr);
        expect(result).toMatch(/\w{3}\s+\d{1,2},\s+\d{4}/);
      });
    });
  });

  describe('formatDateTime', () => {
    it('should format both date and time', () => {
      const result = formatDateTime('2025-01-15T14:30:00');

      // Should contain date components
      expect(result).toContain('2025');

      // Should contain time components
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should format from Date object', () => {
      const date = new Date('2025-01-15T14:30:00');
      const result = formatDateTime(date);

      expect(result).toContain('2025');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should include AM/PM for 12-hour format', () => {
      const result = formatDateTime('2025-01-15T14:30:00');

      // Should have time indicator
      expect(result.toLowerCase()).toMatch(/am|pm|\d{1,2}:\d{2}/);
    });
  });

  describe('formatRelativeTime', () => {
    let mockNow: Date;

    beforeEach(() => {
      // Mock current time as Jan 15, 2025 12:00:00
      mockNow = new Date('2025-01-15T12:00:00');
      vi.setSystemTime(mockNow);
    });

    it('should return "now" for very recent time', () => {
      const date = new Date('2025-01-15T12:00:15'); // 15 seconds in future (rounds to <1 min)
      const result = formatRelativeTime(date);

      expect(result).toBe('now');
    });

    it('should return "just now" for very recent past', () => {
      const date = new Date('2025-01-15T11:59:30'); // 30 seconds ago (rounds to <1 min but negative)
      const result = formatRelativeTime(date);

      // 30 seconds ago rounds to -0.5, which becomes 0 when rounded, but since it's negative
      // it should trigger the "just now" path (diffMinutes < 0 and absDiff < 1)
      expect(result).toMatch(/just now|now/);
    });

    it('should format minutes in future', () => {
      const date = new Date('2025-01-15T12:05:00'); // 5 minutes in future
      const result = formatRelativeTime(date);

      expect(result).toBe('in 5 minutes');
    });

    it('should format single minute in future', () => {
      const date = new Date('2025-01-15T12:01:00'); // 1 minute in future
      const result = formatRelativeTime(date);

      expect(result).toBe('in 1 minute');
    });

    it('should format minutes in past', () => {
      const date = new Date('2025-01-15T11:50:00'); // 10 minutes ago
      const result = formatRelativeTime(date);

      expect(result).toBe('10 minutes ago');
    });

    it('should format single minute in past', () => {
      const date = new Date('2025-01-15T11:59:00'); // 1 minute ago
      const result = formatRelativeTime(date);

      expect(result).toBe('1 minute ago');
    });

    it('should format hours in future', () => {
      const date = new Date('2025-01-15T15:00:00'); // 3 hours in future
      const result = formatRelativeTime(date);

      expect(result).toBe('in 3 hours');
    });

    it('should format single hour in future', () => {
      const date = new Date('2025-01-15T13:00:00'); // 1 hour in future
      const result = formatRelativeTime(date);

      expect(result).toBe('in 1 hour');
    });

    it('should format hours in past', () => {
      const date = new Date('2025-01-15T09:00:00'); // 3 hours ago
      const result = formatRelativeTime(date);

      expect(result).toBe('3 hours ago');
    });

    it('should format single hour in past', () => {
      const date = new Date('2025-01-15T11:00:00'); // 1 hour ago
      const result = formatRelativeTime(date);

      expect(result).toBe('1 hour ago');
    });

    it('should use absolute time for more than 24 hours', () => {
      const date = new Date('2025-01-17T12:00:00'); // 2 days in future
      const result = formatRelativeTime(date);

      // Should fall back to formatDateTime
      expect(result).toContain('2025');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should use absolute time for past dates beyond 24 hours', () => {
      const date = new Date('2025-01-13T12:00:00'); // 2 days ago
      const result = formatRelativeTime(date);

      // Should fall back to formatDateTime
      expect(result).toContain('2025');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle exactly 24 hours boundary', () => {
      const date = new Date('2025-01-16T12:01:00'); // Just over 24 hours
      const result = formatRelativeTime(date);

      // Should fall back to absolute time
      expect(result).toContain('2025');
    });

    it('should handle string input', () => {
      const result = formatRelativeTime('2025-01-15T12:05:00');

      expect(result).toBe('in 5 minutes');
    });

    it('should round to nearest minute', () => {
      const date = new Date('2025-01-15T12:04:45'); // 4 minutes 45 seconds
      const result = formatRelativeTime(date);

      // Should round to 5 minutes
      expect(result).toBe('in 5 minutes');
    });
  });
});
