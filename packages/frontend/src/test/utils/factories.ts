/**
 * Test data factories
 *
 * Create consistent mock data for tests with sensible defaults.
 * All factories accept partial overrides for flexibility.
 */

import type { Route, Stop, Departure } from '@chicagorail/shared';

/**
 * Create a mock Route with defaults
 */
export function createMockRoute(overrides: Partial<Route> = {}): Route {
  return {
    route_id: 'TEST-ROUTE',
    route_short_name: 'TEST',
    route_long_name: 'Test Route Line',
    route_desc: '',
    route_color: '005DAA',
    route_text_color: 'FFFFFF',
    route_url: '',
    ...overrides,
  };
}

/**
 * Create a mock Stop with defaults
 */
export function createMockStop(overrides: Partial<Stop> = {}): Stop {
  return {
    stop_id: 'TEST-STOP',
    stop_name: 'Test Station',
    stop_desc: '',
    stop_lat: 41.8781,
    stop_lon: -87.6298,
    wheelchair_boarding: 1,
    ...overrides,
  };
}

/**
 * Create a mock Departure with defaults
 */
export function createMockDeparture(
  overrides: Partial<Departure> & { route?: Route } = {}
): Departure {
  const { route, ...rest } = overrides;
  return {
    trip_id: 'TEST-TRIP-001',
    departure_time: new Date().toISOString(),
    arrival_time: new Date().toISOString(),
    trip_headsign: 'Test Destination',
    direction: 'outbound',
    route: route ?? createMockRoute(),
    ...rest,
  };
}

/**
 * Create multiple departures with sequential data
 */
export function createMockDepartures(count: number, baseOverrides: Partial<Departure> = {}): Departure[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDeparture({
      trip_id: `trip-${i + 1}`,
      trip_headsign: `Destination ${i + 1}`,
      ...baseOverrides,
    })
  );
}
