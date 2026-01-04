/**
 * MSW request handlers for API mocking
 *
 * These handlers intercept network requests during tests
 * and return mock data.
 */

import { http, HttpResponse } from 'msw';
import { API_CONFIG } from '@/config';
import { createMockRoute, createMockStop, createMockDeparture } from '../utils/factories';

const baseUrl = API_CONFIG.baseUrl;

export const handlers = [
  // GET /routes
  http.get(`${baseUrl}/routes`, () => {
    return HttpResponse.json({
      routes: [
        createMockRoute({ route_id: 'UP-N', route_short_name: 'UP-N', route_long_name: 'Union Pacific North' }),
        createMockRoute({ route_id: 'BNSF', route_short_name: 'BNSF', route_long_name: 'BNSF Railway' }),
        createMockRoute({ route_id: 'ME', route_short_name: 'ME', route_long_name: 'Metra Electric' }),
      ],
    });
  }),

  // GET /stops/search
  http.get(`${baseUrl}/stops/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() ?? '';

    const allStops = [
      createMockStop({ stop_id: 'OGILVIE', stop_name: 'Ogilvie Transportation Center' }),
      createMockStop({ stop_id: 'CUS', stop_name: 'Chicago Union Station' }),
      createMockStop({ stop_id: 'MILLENNIUM', stop_name: 'Millennium Station' }),
      createMockStop({ stop_id: 'LASALLE', stop_name: 'LaSalle Street Station' }),
    ];

    const filtered = allStops.filter((stop) =>
      stop.stop_name.toLowerCase().includes(query)
    );

    return HttpResponse.json({ stops: filtered });
  }),

  // GET /stops/:stopId/departures
  http.get(`${baseUrl}/stops/:stopId/departures`, ({ params }) => {
    const { stopId } = params;

    const stop = createMockStop({
      stop_id: stopId as string,
      stop_name: `${stopId} Station`,
    });

    const departures = [
      createMockDeparture({
        trip_id: 'trip-1',
        departure_time: '2024-01-15T08:30:00',
        arrival_time: '2024-01-15T09:30:00',
        trip_headsign: 'Northbound',
        direction: 'outbound',
        route: createMockRoute({ route_id: 'UP-N' }),
      }),
      createMockDeparture({
        trip_id: 'trip-2',
        departure_time: '2024-01-15T09:00:00',
        arrival_time: '2024-01-15T10:00:00',
        trip_headsign: 'Southbound',
        direction: 'inbound',
        route: createMockRoute({ route_id: 'BNSF' }),
      }),
    ];

    return HttpResponse.json({ stop, departures });
  }),

  // GET /trips/direct
  http.get(`${baseUrl}/trips/direct`, () => {
    return HttpResponse.json({
      trips: [],
    });
  }),

  // GET /system
  http.get(`${baseUrl}/system`, () => {
    return HttpResponse.json({
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    });
  }),
];
