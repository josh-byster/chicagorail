import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { utils } from '@chicagorail/shared';

describe('Time Utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getRelativeTime', () => {
    it('should return "Now" for departures less than 1 minute away', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departure30SecsAway = new Date('2024-12-14T10:00:30Z').toISOString();
      expect(utils.getRelativeTime(departure30SecsAway)).toBe('Now');

      const departure45SecsAway = new Date('2024-12-14T10:00:45Z').toISOString();
      expect(utils.getRelativeTime(departure45SecsAway)).toBe('Now');
    });

    it('should return minutes for departures under 1 hour', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departure5MinsAway = new Date('2024-12-14T10:05:00Z').toISOString();
      expect(utils.getRelativeTime(departure5MinsAway)).toBe('5 min');

      const departure15MinsAway = new Date('2024-12-14T10:15:00Z').toISOString();
      expect(utils.getRelativeTime(departure15MinsAway)).toBe('15 min');

      const departure59MinsAway = new Date('2024-12-14T10:59:00Z').toISOString();
      expect(utils.getRelativeTime(departure59MinsAway)).toBe('59 min');
    });

    it('should return hours and minutes for departures over 1 hour', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departure1HourAway = new Date('2024-12-14T11:00:00Z').toISOString();
      expect(utils.getRelativeTime(departure1HourAway)).toBe('1h 0m');

      const departure1Hour30MinsAway = new Date('2024-12-14T11:30:00Z').toISOString();
      expect(utils.getRelativeTime(departure1Hour30MinsAway)).toBe('1h 30m');

      const departure2Hours15MinsAway = new Date('2024-12-14T12:15:00Z').toISOString();
      expect(utils.getRelativeTime(departure2Hours15MinsAway)).toBe('2h 15m');
    });

    it('should handle departures many hours away', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departure12HoursAway = new Date('2024-12-14T22:00:00Z').toISOString();
      expect(utils.getRelativeTime(departure12HoursAway)).toBe('12h 0m');

      const departure24HoursAway = new Date('2024-12-15T10:00:00Z').toISOString();
      expect(utils.getRelativeTime(departure24HoursAway)).toBe('24h 0m');
    });

    it('should handle edge case at exactly 1 minute', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departure1MinAway = new Date('2024-12-14T10:01:00Z').toISOString();
      expect(utils.getRelativeTime(departure1MinAway)).toBe('1 min');
    });

    it('should handle edge case at exactly 1 hour', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departure1HourAway = new Date('2024-12-14T11:00:00Z').toISOString();
      expect(utils.getRelativeTime(departure1HourAway)).toBe('1h 0m');
    });

    it('should handle seconds rounding down', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      // 5 minutes and 45 seconds should round down to 5 minutes
      const departure = new Date('2024-12-14T10:05:45Z').toISOString();
      expect(utils.getRelativeTime(departure)).toBe('5 min');
    });
  });

  describe('formatTime', () => {
    it('should format times correctly with 12-hour format and AM/PM', () => {
      const morningTime = new Date('2024-12-14T08:30:00').toISOString();
      const formatted = utils.formatTime(morningTime);

      // Should include hour, minute, and AM/PM
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('should format afternoon times correctly', () => {
      const afternoonTime = new Date('2024-12-14T14:45:00').toISOString();
      const formatted = utils.formatTime(afternoonTime);

      expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('should use 12-hour format (not 24-hour)', () => {
      const time = new Date('2024-12-14T15:00:00').toISOString();
      const formatted = utils.formatTime(time);

      // Should not show 15:00, should use 12-hour format
      expect(formatted).not.toMatch(/15:/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('should include minutes with two digits', () => {
      const time = new Date('2024-12-14T09:05:00').toISOString();
      const formatted = utils.formatTime(time);

      // Minutes should always be 2 digits
      expect(formatted).toMatch(/\d{1,2}:05\s*(AM|PM)/i);
    });

    it('should handle various times throughout the day', () => {
      const times = [
        '2024-12-14T06:15:00',
        '2024-12-14T09:30:00',
        '2024-12-14T12:45:00',
        '2024-12-14T15:00:00',
        '2024-12-14T18:20:00',
        '2024-12-14T21:55:00'
      ];

      times.forEach(time => {
        const formatted = utils.formatTime(time);
        expect(formatted).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      });
    });

    it('should return consistent format', () => {
      const time1 = new Date('2024-12-14T10:30:00').toISOString();
      const time2 = new Date('2024-12-14T22:45:00').toISOString();

      const formatted1 = utils.formatTime(time1);
      const formatted2 = utils.formatTime(time2);

      // Both should match the expected format
      expect(formatted1).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
      expect(formatted2).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });
  });

  describe('Time Utilities Integration', () => {
    it('should work together for typical use case', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      const departureTime = new Date('2024-12-14T10:15:00Z').toISOString();

      const relativeTime = utils.getRelativeTime(departureTime);
      const formattedTime = utils.formatTime(departureTime);

      expect(relativeTime).toBe('15 min');
      expect(formattedTime).toMatch(/\d{1,2}:15\s*(AM|PM)/i);
    });

    it('should handle ISO strings from GTFS time conversion', () => {
      const now = new Date('2024-12-14T10:00:00Z');
      jest.setSystemTime(now);

      // Simulate a time that would come from GTFS conversion
      const gtfsConvertedTime = new Date('2024-12-14T17:30:00Z').toISOString();

      const relativeTime = utils.getRelativeTime(gtfsConvertedTime);
      const formattedTime = utils.formatTime(gtfsConvertedTime);

      expect(relativeTime).toMatch(/\d+h \d+m/);
      expect(formattedTime).toMatch(/\d{1,2}:30\s*(AM|PM)/i);
    });
  });
});
