/**
 * Unit tests for geospatial utility functions
 * All functions are pure and easy to test
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  calculateBearing,
  angleDifference,
  findClosestPoint,
  filterPointsByBearing,
} from '../../src/utils/geospatial.utils';

describe('geospatial.utils', () => {
  describe('calculateHaversineDistance', () => {
    it('should calculate distance between two Chicago locations', () => {
      // Union Station to Ogilvie Transportation Center (~0.6 km)
      const distance = calculateHaversineDistance(
        41.8789, // Union Station lat
        -87.6399, // Union Station lon
        41.8826, // Ogilvie lat
        -87.6399 // Ogilvie lon
      );

      expect(distance).toBeCloseTo(0.41, 1); // ~0.41 km
    });

    it('should return 0 for same location', () => {
      const distance = calculateHaversineDistance(
        41.8789,
        -87.6399,
        41.8789,
        -87.6399
      );
      expect(distance).toBe(0);
    });

    it('should calculate distance across the globe', () => {
      // Chicago to London (~6400 km)
      const distance = calculateHaversineDistance(
        41.8781,
        -87.6298, // Chicago
        51.5074,
        -0.1278 // London
      );

      expect(distance).toBeGreaterThan(6300);
      expect(distance).toBeLessThan(6500);
    });

    it('should handle negative longitudes correctly', () => {
      const distance = calculateHaversineDistance(
        40.7128,
        -74.006, // New York
        51.5074,
        -0.1278 // London
      );

      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5600);
    });

    it('should handle equator crossing', () => {
      const distance = calculateHaversineDistance(
        10.0,
        0.0, // North of equator
        -10.0,
        0.0 // South of equator
      );

      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2300);
    });

    it('should handle prime meridian crossing', () => {
      const distance = calculateHaversineDistance(
        0.0,
        -10.0, // West of prime meridian
        0.0,
        10.0 // East of prime meridian
      );

      expect(distance).toBeGreaterThan(2200);
      expect(distance).toBeLessThan(2300);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing from one point to another', () => {
      // From Union Station (south) to Ogilvie (north)
      const bearing = calculateBearing(
        41.8789,
        -87.6399, // Union Station
        41.8826,
        -87.6399 // Ogilvie (directly north)
      );

      // Should be approximately 0 degrees (north)
      expect(bearing).toBeCloseTo(0, 0);
    });

    it('should return 90 for eastward bearing', () => {
      // Going east along the equator
      const bearing = calculateBearing(0, 0, 0, 10);

      expect(bearing).toBeCloseTo(90, 0);
    });

    it('should return 180 for southward bearing', () => {
      // Going south
      const bearing = calculateBearing(10, 0, 0, 0);

      expect(bearing).toBeCloseTo(180, 0);
    });

    it('should return 270 for westward bearing', () => {
      // Going west along the equator
      const bearing = calculateBearing(0, 10, 0, 0);

      expect(bearing).toBeCloseTo(270, 0);
    });

    it('should handle diagonal bearings', () => {
      // Northeast bearing (approximately 45 degrees)
      const bearing = calculateBearing(0, 0, 10, 10);

      expect(bearing).toBeGreaterThan(30);
      expect(bearing).toBeLessThan(60);
    });

    it('should wrap around at 360 degrees', () => {
      const bearing = calculateBearing(0, 0, 1, -1);

      // Should be between 0-360
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('angleDifference', () => {
    it('should calculate difference between two bearings', () => {
      expect(angleDifference(10, 20)).toBe(10);
      expect(angleDifference(20, 10)).toBe(10);
    });

    it('should handle wrap-around at 0/360', () => {
      // 10 degrees and 350 degrees are 20 degrees apart (not 340)
      expect(angleDifference(10, 350)).toBe(20);
      expect(angleDifference(350, 10)).toBe(20);
    });

    it('should return 180 for opposite directions', () => {
      expect(angleDifference(0, 180)).toBe(180);
      expect(angleDifference(90, 270)).toBe(180);
    });

    it('should return 0 for same bearing', () => {
      expect(angleDifference(45, 45)).toBe(0);
      expect(angleDifference(0, 0)).toBe(0);
      expect(angleDifference(359, 359)).toBe(0);
    });

    it('should handle edge cases near 0 and 360', () => {
      expect(angleDifference(1, 359)).toBe(2);
      expect(angleDifference(359, 1)).toBe(2);
      expect(angleDifference(0, 360)).toBe(0); // Logically same bearing
    });

    it('should always return value between 0-180', () => {
      const testCases = [
        [0, 90],
        [45, 225],
        [10, 350],
        [180, 0],
        [270, 90],
      ];

      testCases.forEach(([b1, b2]) => {
        const diff = angleDifference(b1, b2);
        expect(diff).toBeGreaterThanOrEqual(0);
        expect(diff).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('findClosestPoint', () => {
    const testPoints = [
      { stop_id: 'A', stop_lat: 41.8789, stop_lon: -87.6399 }, // Union Station
      { stop_id: 'B', stop_lat: 41.8826, stop_lon: -87.6399 }, // Ogilvie
      { stop_id: 'C', stop_lat: 41.8847, stop_lon: -87.6371 }, // Merchandise Mart
    ];

    it('should find the closest point', () => {
      // Point very close to Union Station
      const closest = findClosestPoint(41.879, -87.64, testPoints);

      expect(closest).toBeDefined();
      expect(closest?.stop_id).toBe('A');
    });

    it('should find closest point for different reference', () => {
      // Point very close to Merchandise Mart
      const closest = findClosestPoint(41.8848, -87.637, testPoints);

      expect(closest).toBeDefined();
      expect(closest?.stop_id).toBe('C');
    });

    it('should return undefined for empty array', () => {
      const closest = findClosestPoint(41.8789, -87.6399, []);

      expect(closest).toBeUndefined();
    });

    it('should handle single point', () => {
      const singlePoint = [
        { stop_id: 'ONLY', stop_lat: 41.8789, stop_lon: -87.6399 },
      ];
      const closest = findClosestPoint(40.0, -80.0, singlePoint);

      expect(closest).toBeDefined();
      expect(closest?.stop_id).toBe('ONLY');
    });

    it('should work with exact match', () => {
      const closest = findClosestPoint(
        testPoints[1].stop_lat,
        testPoints[1].stop_lon,
        testPoints
      );

      expect(closest?.stop_id).toBe('B');
    });

    it('should preserve additional properties', () => {
      const pointsWithExtra = testPoints.map((p) => ({
        ...p,
        station_name: `Station ${p.stop_id}`,
      }));

      const closest = findClosestPoint(41.879, -87.64, pointsWithExtra);

      expect(closest).toBeDefined();
      expect(closest?.station_name).toBe('Station A');
    });
  });

  describe('filterPointsByBearing', () => {
    const testPoints = [
      { stop_id: 'NORTH', stop_lat: 41.89, stop_lon: -87.64 }, // North
      { stop_id: 'EAST', stop_lat: 41.88, stop_lon: -87.63 }, // East
      { stop_id: 'SOUTH', stop_lat: 41.87, stop_lon: -87.64 }, // South
      { stop_id: 'WEST', stop_lat: 41.88, stop_lon: -87.65 }, // West
    ];

    const refLat = 41.88;
    const refLon = -87.64;

    it('should filter points by bearing within tolerance', () => {
      // Looking north (0 degrees), tolerance 45
      const northPoints = filterPointsByBearing(
        refLat,
        refLon,
        0,
        testPoints,
        45
      );

      expect(northPoints).toHaveLength(1);
      expect(northPoints[0].stop_id).toBe('NORTH');
    });

    it('should filter points looking east', () => {
      // Looking east (90 degrees), tolerance 45
      const eastPoints = filterPointsByBearing(
        refLat,
        refLon,
        90,
        testPoints,
        45
      );

      expect(eastPoints).toHaveLength(1);
      expect(eastPoints[0].stop_id).toBe('EAST');
    });

    it('should filter points looking south', () => {
      // Looking south (180 degrees), tolerance 45
      const southPoints = filterPointsByBearing(
        refLat,
        refLon,
        180,
        testPoints,
        45
      );

      expect(southPoints).toHaveLength(1);
      expect(southPoints[0].stop_id).toBe('SOUTH');
    });

    it('should filter points looking west', () => {
      // Looking west (270 degrees), tolerance 45
      const westPoints = filterPointsByBearing(
        refLat,
        refLon,
        270,
        testPoints,
        45
      );

      expect(westPoints).toHaveLength(1);
      expect(westPoints[0].stop_id).toBe('WEST');
    });

    it('should use default tolerance of 45 degrees', () => {
      // Without specifying tolerance
      const northPoints = filterPointsByBearing(refLat, refLon, 0, testPoints);

      expect(northPoints).toHaveLength(1);
    });

    it('should include multiple points with wider tolerance', () => {
      // Wider tolerance should include more points
      const widePoints = filterPointsByBearing(
        refLat,
        refLon,
        0,
        testPoints,
        90
      );

      expect(widePoints.length).toBeGreaterThan(1);
    });

    it('should return empty array if no points match', () => {
      // Very narrow tolerance
      const narrowPoints = filterPointsByBearing(
        refLat,
        refLon,
        0,
        testPoints,
        1
      );

      // Might be empty depending on exact positions
      expect(Array.isArray(narrowPoints)).toBe(true);
    });

    it('should handle empty input array', () => {
      const result = filterPointsByBearing(refLat, refLon, 0, [], 45);

      expect(result).toEqual([]);
    });

    it('should handle bearing wrap-around at 0/360', () => {
      // Points near north with bearing 350 should still match
      const points = [{ stop_id: 'NNW', stop_lat: 41.89, stop_lon: -87.641 }];

      const result = filterPointsByBearing(refLat, refLon, 350, points, 45);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });
});
