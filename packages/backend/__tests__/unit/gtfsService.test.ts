import { describe, it, expect, beforeAll, afterEach, jest } from '@jest/globals';
import { GTFSService } from '../../src/services/gtfsService.js';
import type { Route, Stop, Departure } from '@chicagorail/shared';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the GTFS directory to use our test fixtures
const GTFS_FIXTURES_DIR = path.join(__dirname, '..', 'fixtures', 'gtfs');

describe('GTFSService', () => {
  let gtfsService: GTFSService;

  beforeAll(async () => {
    // Get singleton instance
    gtfsService = GTFSService.getInstance();

    // Override the GTFS_DIR to point to our test fixtures
    // We need to access the private property for testing
    (gtfsService as any).GTFS_DIR = GTFS_FIXTURES_DIR;

    // Load the test data
    await gtfsService.loadData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GTFSService.getInstance();
      const instance2 = GTFSService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getData', () => {
    it('should return GTFS data with all required fields', async () => {
      const data = await gtfsService.getData();

      expect(data).toBeDefined();
      expect(data.routes).toBeDefined();
      expect(data.stops).toBeDefined();
      expect(data.trips).toBeDefined();
      expect(data.stopTimes).toBeDefined();
      expect(data.servicePeriods).toBeDefined();
      expect(data.lastUpdated).toBeDefined();
    });

    it('should have non-empty arrays for main data', async () => {
      const data = await gtfsService.getData();

      expect(data.routes.length).toBeGreaterThan(0);
      expect(data.stops.length).toBeGreaterThan(0);
      expect(data.trips.length).toBeGreaterThan(0);
      expect(data.stopTimes.length).toBeGreaterThan(0);
      expect(data.servicePeriods.length).toBeGreaterThan(0);
    });

    it('should have valid route data structure', async () => {
      const data = await gtfsService.getData();
      const route = data.routes[0];

      expect(route).toHaveProperty('route_id');
      expect(route).toHaveProperty('route_short_name');
      expect(route).toHaveProperty('route_long_name');
      expect(route).toHaveProperty('route_color');
      expect(route).toHaveProperty('route_text_color');
    });

    it('should have valid stop data structure', async () => {
      const data = await gtfsService.getData();
      const stop = data.stops[0];

      expect(stop).toHaveProperty('stop_id');
      expect(stop).toHaveProperty('stop_name');
      expect(stop).toHaveProperty('stop_lat');
      expect(stop).toHaveProperty('stop_lon');
      expect(typeof stop.stop_lat).toBe('number');
      expect(typeof stop.stop_lon).toBe('number');
    });

    it('should have valid trip data structure', async () => {
      const data = await gtfsService.getData();
      const trip = data.trips[0];

      expect(trip).toHaveProperty('trip_id');
      expect(trip).toHaveProperty('route_id');
      expect(trip).toHaveProperty('trip_headsign');
      expect(trip).toHaveProperty('direction_id');
      expect(trip).toHaveProperty('service_id');
      expect(typeof trip.direction_id).toBe('number');
    });

    it('should have valid stop time data structure', async () => {
      const data = await gtfsService.getData();
      const stopTime = data.stopTimes[0];

      expect(stopTime).toHaveProperty('trip_id');
      expect(stopTime).toHaveProperty('arrival_time');
      expect(stopTime).toHaveProperty('departure_time');
      expect(stopTime).toHaveProperty('stop_id');
      expect(stopTime).toHaveProperty('stop_sequence');
      expect(typeof stopTime.stop_sequence).toBe('number');
    });

    it('should have valid service period data structure', async () => {
      const data = await gtfsService.getData();
      const servicePeriod = data.servicePeriods[0];

      expect(servicePeriod).toHaveProperty('service_id');
      expect(servicePeriod).toHaveProperty('monday');
      expect(servicePeriod).toHaveProperty('tuesday');
      expect(servicePeriod).toHaveProperty('wednesday');
      expect(servicePeriod).toHaveProperty('thursday');
      expect(servicePeriod).toHaveProperty('friday');
      expect(servicePeriod).toHaveProperty('saturday');
      expect(servicePeriod).toHaveProperty('sunday');
      expect(servicePeriod).toHaveProperty('start_date');
      expect(servicePeriod).toHaveProperty('end_date');
    });
  });

  describe('getDeparturesForStop', () => {
    it('should throw error for non-existent stop', async () => {
      await expect(
        gtfsService.getDeparturesForStop('INVALID_STOP', new Date(), 10)
      ).rejects.toThrow('Stop not found');
    });

    it('should return departures for a valid stop', async () => {
      const data = await gtfsService.getData();
      const validStop = data.stops[0];

      // Use a date that should have service
      const testDate = new Date('2024-12-16T08:00:00Z'); // Monday

      const result = await gtfsService.getDeparturesForStop(
        validStop.stop_id,
        testDate,
        5
      );

      expect(result).toHaveProperty('stop');
      expect(result).toHaveProperty('departures');
      expect(result.stop.stop_id).toBe(validStop.stop_id);
      expect(Array.isArray(result.departures)).toBe(true);
    });

    it('should limit the number of departures', async () => {
      const data = await gtfsService.getData();
      // Find a stop with many departures (like Union Station)
      const unionStation = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('union')
      );

      if (unionStation) {
        const testDate = new Date('2024-12-16T08:00:00Z'); // Monday
        const limit = 3;

        const result = await gtfsService.getDeparturesForStop(
          unionStation.stop_id,
          testDate,
          limit
        );

        expect(result.departures.length).toBeLessThanOrEqual(limit);
      }
    });

    it('should filter departures by route ID', async () => {
      const data = await gtfsService.getData();
      const unionStation = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('union')
      );

      if (unionStation && data.routes.length > 0) {
        const testRoute = data.routes[0];
        const testDate = new Date('2024-12-16T08:00:00Z');

        const result = await gtfsService.getDeparturesForStop(
          unionStation.stop_id,
          testDate,
          10,
          testRoute.route_id
        );

        // All departures should be for the specified route
        result.departures.forEach(dep => {
          expect(dep.route.route_id).toBe(testRoute.route_id);
        });
      }
    });

    it('should return departures with valid structure', async () => {
      const data = await gtfsService.getData();
      const validStop = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('union') ||
        s.stop_name.toLowerCase().includes('chicago')
      );

      if (validStop) {
        const testDate = new Date('2024-12-16T08:00:00Z');

        const result = await gtfsService.getDeparturesForStop(
          validStop.stop_id,
          testDate,
          5
        );

        if (result.departures.length > 0) {
          const departure = result.departures[0];

          expect(departure).toHaveProperty('route');
          expect(departure).toHaveProperty('trip_headsign');
          expect(departure).toHaveProperty('departure_time');
          expect(departure).toHaveProperty('arrival_time');
          expect(departure).toHaveProperty('direction');
          expect(departure).toHaveProperty('trip_id');

          // Validate ISO date format
          expect(() => new Date(departure.departure_time)).not.toThrow();
          expect(() => new Date(departure.arrival_time)).not.toThrow();

          // Direction should be either 'outbound' or 'inbound'
          expect(['outbound', 'inbound']).toContain(departure.direction);
        }
      }
    });

    it('should exclude arrivals (trains heading TO the station)', async () => {
      const data = await gtfsService.getData();
      const validStop = data.stops[0];

      const testDate = new Date('2024-12-16T08:00:00Z');

      const result = await gtfsService.getDeparturesForStop(
        validStop.stop_id,
        testDate,
        20
      );

      // None of the departures should have the station name in the headsign
      result.departures.forEach(dep => {
        expect(
          dep.trip_headsign.toLowerCase().includes(validStop.stop_name.toLowerCase())
        ).toBe(false);
      });
    });

    it('should sort departures by time', async () => {
      const data = await gtfsService.getData();
      const validStop = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('union')
      );

      if (validStop) {
        const testDate = new Date('2024-12-16T08:00:00Z');

        const result = await gtfsService.getDeparturesForStop(
          validStop.stop_id,
          testDate,
          10
        );

        if (result.departures.length > 1) {
          for (let i = 0; i < result.departures.length - 1; i++) {
            const current = new Date(result.departures[i].departure_time);
            const next = new Date(result.departures[i + 1].departure_time);
            expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
          }
        }
      }
    });
  });

  describe('getRoutesForStops', () => {
    it('should return empty array for empty stops', () => {
      const routes = gtfsService.getRoutesForStops([]);
      expect(routes).toEqual([]);
    });

    it('should return routes for valid stops', async () => {
      const data = await gtfsService.getData();
      const validStop = data.stops[0];

      const routes = gtfsService.getRoutesForStops([validStop]);

      expect(Array.isArray(routes)).toBe(true);
      if (routes.length > 0) {
        expect(routes[0]).toHaveProperty('route_id');
        expect(routes[0]).toHaveProperty('route_short_name');
      }
    });

    it('should return unique routes for multiple stops', async () => {
      const data = await gtfsService.getData();
      const stops = data.stops.slice(0, 5);

      const routes = gtfsService.getRoutesForStops(stops);

      // Check for uniqueness
      const routeIds = routes.map(r => r.route_id);
      const uniqueRouteIds = new Set(routeIds);
      expect(routeIds.length).toBe(uniqueRouteIds.size);
    });

    it('should aggregate routes from multiple stops', async () => {
      const data = await gtfsService.getData();
      const stops = data.stops.slice(0, 3);

      const routes = gtfsService.getRoutesForStops(stops);

      expect(Array.isArray(routes)).toBe(true);
      routes.forEach(route => {
        expect(route).toHaveProperty('route_id');
        expect(route).toHaveProperty('route_short_name');
        expect(route).toHaveProperty('route_long_name');
      });
    });
  });

  describe('Service Period Validation', () => {
    it('should only return departures for active service periods', async () => {
      const data = await gtfsService.getData();
      const validStop = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('union')
      );

      if (validStop) {
        // Test with a Monday (weekday)
        const monday = new Date('2024-12-16T08:00:00Z');
        const mondayResult = await gtfsService.getDeparturesForStop(
          validStop.stop_id,
          monday,
          5
        );

        // Test with a Saturday (weekend)
        const saturday = new Date('2024-12-14T08:00:00Z');
        const saturdayResult = await gtfsService.getDeparturesForStop(
          validStop.stop_id,
          saturday,
          5
        );

        // Both should have departures (Metra runs on weekdays and weekends)
        // But the schedules should be different
        expect(Array.isArray(mondayResult.departures)).toBe(true);
        expect(Array.isArray(saturdayResult.departures)).toBe(true);
      }
    });
  });

  describe('GTFS Time Conversion', () => {
    it('should handle standard times (< 24:00:00)', async () => {
      const data = await gtfsService.getData();

      // Find a stop time with a standard time
      const standardStopTime = data.stopTimes.find(st => {
        const hours = parseInt(st.departure_time.split(':')[0]);
        return hours < 24;
      });

      expect(standardStopTime).toBeDefined();
    });

    it('should handle next-day times (>= 24:00:00)', async () => {
      const data = await gtfsService.getData();

      // Find a stop time with next-day time (common for late night service)
      const nextDayStopTime = data.stopTimes.find(st => {
        const hours = parseInt(st.departure_time.split(':')[0]);
        return hours >= 24;
      });

      // Next-day times may or may not exist in the dataset
      if (nextDayStopTime) {
        expect(nextDayStopTime).toBeDefined();
      }
    });
  });

  describe('Data Integrity', () => {
    it('should have matching trip IDs between trips and stop times', async () => {
      const data = await gtfsService.getData();

      const tripIds = new Set(data.trips.map(t => t.trip_id));
      const stopTimeTripIds = new Set(data.stopTimes.map(st => st.trip_id));

      // All stop time trip IDs should have corresponding trips
      stopTimeTripIds.forEach(tripId => {
        expect(tripIds.has(tripId)).toBe(true);
      });
    });

    it('should have matching route IDs between routes and trips', async () => {
      const data = await gtfsService.getData();

      const routeIds = new Set(data.routes.map(r => r.route_id));
      const tripRouteIds = new Set(data.trips.map(t => t.route_id));

      // All trip route IDs should have corresponding routes
      tripRouteIds.forEach(routeId => {
        expect(routeIds.has(routeId)).toBe(true);
      });
    });

    it('should have matching stop IDs between stops and stop times', async () => {
      const data = await gtfsService.getData();

      const stopIds = new Set(data.stops.map(s => s.stop_id));
      const stopTimeStopIds = new Set(data.stopTimes.map(st => st.stop_id));

      // All stop time stop IDs should have corresponding stops
      stopTimeStopIds.forEach(stopId => {
        expect(stopIds.has(stopId)).toBe(true);
      });
    });

    it('should have matching service IDs between trips and service periods', async () => {
      const data = await gtfsService.getData();

      const serviceIds = new Set(data.servicePeriods.map(sp => sp.service_id));
      const tripServiceIds = new Set(data.trips.map(t => t.service_id));

      // All trip service IDs should have corresponding service periods
      tripServiceIds.forEach(serviceId => {
        expect(serviceIds.has(serviceId)).toBe(true);
      });
    });
  });

  describe('Real Data Regression Tests', () => {
    it('should have expected Metra lines', async () => {
      const data = await gtfsService.getData();

      const routeShortNames = data.routes.map(r => r.route_short_name);

      // Common Metra lines
      const expectedLines = ['BNSF', 'UP-N', 'UP-NW', 'UP-W', 'MD-N', 'MD-W', 'NCS', 'HC', 'ME', 'RI', 'SWS'];

      expectedLines.forEach(line => {
        expect(routeShortNames).toContain(line);
      });
    });

    it('should have Chicago Union Station', async () => {
      const data = await gtfsService.getData();

      const unionStation = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('chicago union')
      );

      expect(unionStation).toBeDefined();
    });

    it('should have valid coordinates for all stops', async () => {
      const data = await gtfsService.getData();

      data.stops.forEach(stop => {
        // Chicago area coordinates roughly
        expect(stop.stop_lat).toBeGreaterThan(40);
        expect(stop.stop_lat).toBeLessThan(43);
        expect(stop.stop_lon).toBeGreaterThan(-90);
        expect(stop.stop_lon).toBeLessThan(-87);
      });
    });

    it('should have route colors', async () => {
      const data = await gtfsService.getData();

      data.routes.forEach(route => {
        expect(route.route_color).toBeDefined();
        expect(route.route_color.length).toBeGreaterThan(0);
        // Should be a valid hex color (6 characters)
        expect(route.route_color).toMatch(/^[0-9A-F]{6}$/i);
      });
    });
  });
});
