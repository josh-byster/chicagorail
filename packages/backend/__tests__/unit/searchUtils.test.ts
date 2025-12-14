import { describe, it, expect } from '@jest/globals';
import { utils } from '@chicagorail/shared';
import type { Stop } from '@chicagorail/shared';

describe('Search Utilities', () => {
  describe('rankSearchResults', () => {
    const mockStops: Stop[] = [
      {
        stop_id: 'CHICAGO',
        stop_name: 'Chicago Union Station',
        stop_desc: '',
        stop_lat: 41.8789,
        stop_lon: -87.6398,
        wheelchair_boarding: 1
      },
      {
        stop_id: 'NAPERVILLE',
        stop_name: 'Naperville',
        stop_desc: '',
        stop_lat: 41.7508,
        stop_lon: -88.1535,
        wheelchair_boarding: 1
      },
      {
        stop_id: 'OAKPARK',
        stop_name: 'Oak Park',
        stop_desc: '',
        stop_lat: 41.8728,
        stop_lon: -87.7912,
        wheelchair_boarding: 1
      },
      {
        stop_id: 'WESTCHICAGO',
        stop_name: 'West Chicago',
        stop_desc: '',
        stop_lat: 41.8811,
        stop_lon: -88.1989,
        wheelchair_boarding: 1
      },
      {
        stop_id: 'PARK',
        stop_name: 'Park Forest',
        stop_desc: '',
        stop_lat: 41.4772,
        stop_lon: -87.6844,
        wheelchair_boarding: 1
      }
    ];

    it('should rank exact prefix matches first', () => {
      const results = utils.rankSearchResults('Chicago', mockStops);

      expect(results[0].stop_name).toBe('Chicago Union Station');
    });

    it('should rank prefix matches higher than substring matches', () => {
      const results = utils.rankSearchResults('Park', mockStops);

      // 'Park Forest' (prefix) should come before 'Oak Park' (substring)
      const parkForestIndex = results.findIndex(s => s.stop_name === 'Park Forest');
      const oakParkIndex = results.findIndex(s => s.stop_name === 'Oak Park');

      expect(parkForestIndex).toBeLessThan(oakParkIndex);
    });

    it('should include substring matches', () => {
      const results = utils.rankSearchResults('Park', mockStops);

      const names = results.map(s => s.stop_name);
      expect(names).toContain('Oak Park');
      expect(names).toContain('Park Forest');
    });

    it('should be case-insensitive', () => {
      const lowerResults = utils.rankSearchResults('chicago', mockStops);
      const upperResults = utils.rankSearchResults('CHICAGO', mockStops);
      const mixedResults = utils.rankSearchResults('ChIcAgO', mockStops);

      expect(lowerResults[0].stop_name).toBe('Chicago Union Station');
      expect(upperResults[0].stop_name).toBe('Chicago Union Station');
      expect(mixedResults[0].stop_name).toBe('Chicago Union Station');
    });

    it('should exclude non-matching stops', () => {
      const results = utils.rankSearchResults('Springfield', mockStops);

      expect(results.length).toBe(0);
    });

    it('should handle partial matches', () => {
      const results = utils.rankSearchResults('chi', mockStops);

      const names = results.map(s => s.stop_name);
      expect(names).toContain('Chicago Union Station');
      expect(names).toContain('West Chicago');
    });

    it('should return all items for empty query', () => {
      const results = utils.rankSearchResults('', mockStops);

      // Empty query matches all items (because ''.includes('') is true)
      // This is current behavior - could be improved to return empty array
      expect(results.length).toBe(mockStops.length);
    });

    it('should handle empty stops array', () => {
      const results = utils.rankSearchResults('Chicago', []);

      expect(results.length).toBe(0);
    });

    it('should maintain stop data integrity', () => {
      const results = utils.rankSearchResults('Chicago', mockStops);

      results.forEach(result => {
        expect(result).toHaveProperty('stop_id');
        expect(result).toHaveProperty('stop_name');
        expect(result).toHaveProperty('stop_lat');
        expect(result).toHaveProperty('stop_lon');
        expect(result).toHaveProperty('wheelchair_boarding');
      });
    });

    it('should handle special characters in query', () => {
      const specialStops: Stop[] = [
        {
          stop_id: 'TEST',
          stop_name: "O'Hare Transfer",
          stop_desc: '',
          stop_lat: 41.9786,
          stop_lon: -87.9048,
          wheelchair_boarding: 1
        }
      ];

      const results = utils.rankSearchResults("O'Hare", specialStops);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle queries with spaces', () => {
      const results = utils.rankSearchResults('Chicago Union', mockStops);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].stop_name).toBe('Chicago Union Station');
    });

    it('should rank multiple prefix matches consistently', () => {
      const testStops: Stop[] = [
        {
          stop_id: 'A',
          stop_name: 'Arlington Heights',
          stop_desc: '',
          stop_lat: 42.0653,
          stop_lon: -87.9806,
          wheelchair_boarding: 1
        },
        {
          stop_id: 'B',
          stop_name: 'Arlington Park',
          stop_desc: '',
          stop_lat: 42.0667,
          stop_lon: -87.9889,
          wheelchair_boarding: 1
        },
        {
          stop_id: 'C',
          stop_name: 'West Arlington',
          stop_desc: '',
          stop_lat: 42.0700,
          stop_lon: -87.9900,
          wheelchair_boarding: 1
        }
      ];

      const results = utils.rankSearchResults('Arlington', testStops);

      // All prefix matches should come before substring matches
      expect(results[0].stop_name).toMatch(/^Arlington/);
      expect(results[1].stop_name).toMatch(/^Arlington/);
    });

    it('should handle single character queries', () => {
      const results = utils.rankSearchResults('P', mockStops);

      const names = results.map(s => s.stop_name);
      expect(names).toContain('Park Forest');
      expect(names).toContain('Oak Park');
      expect(names).toContain('Naperville');
    });
  });
});
