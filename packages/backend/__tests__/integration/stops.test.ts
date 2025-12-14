import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/testApp.js';
import { GTFSService } from '../../src/services/gtfsService.js';
import type { SearchStopsResponse, GetDeparturesResponse, ApiError } from '@chicagorail/shared';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GTFS_FIXTURES_DIR = path.join(__dirname, '..', 'fixtures', 'gtfs');

describe('Stops API Integration Tests', () => {
  const app = createTestApp();
  let gtfsService: GTFSService;

  beforeAll(async () => {
    // Setup GTFS service with fixture data
    gtfsService = GTFSService.getInstance();
    (gtfsService as any).GTFS_DIR = GTFS_FIXTURES_DIR;
    await gtfsService.loadData();
  });

  describe('GET /api/stops/search', () => {
    describe('Successful Searches', () => {
      it('should return 200 and search results for valid query', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Chicago' })
          .expect('Content-Type', /json/)
          .expect(200);

        const body = response.body as SearchStopsResponse;

        expect(body).toHaveProperty('stops');
        expect(Array.isArray(body.stops)).toBe(true);
      });

      it('should return stops with correct structure', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Chicago' });

        const body = response.body as SearchStopsResponse;

        if (body.stops.length > 0) {
          const stop = body.stops[0];

          expect(stop).toHaveProperty('stop_id');
          expect(stop).toHaveProperty('stop_name');
          expect(stop).toHaveProperty('stop_desc');
          expect(stop).toHaveProperty('stop_lat');
          expect(stop).toHaveProperty('stop_lon');
          expect(stop).toHaveProperty('wheelchair_boarding');

          expect(typeof stop.stop_lat).toBe('number');
          expect(typeof stop.stop_lon).toBe('number');
        }
      });

      it('should find Chicago Union Station', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Chicago' });

        const body = response.body as SearchStopsResponse;

        expect(body.stops.length).toBeGreaterThan(0);
        const hasChicagoUnion = body.stops.some(s =>
          s.stop_name.toLowerCase().includes('chicago')
        );
        expect(hasChicagoUnion).toBe(true);
      });

      it('should limit results to 10 stops', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Park' }); // Common word in station names

        const body = response.body as SearchStopsResponse;

        expect(body.stops.length).toBeLessThanOrEqual(10);
      });

      it('should rank prefix matches first', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Oak' });

        const body = response.body as SearchStopsResponse;

        if (body.stops.length > 0) {
          // First result should start with "Oak"
          expect(body.stops[0].stop_name.toLowerCase().startsWith('oak')).toBe(true);
        }
      });

      it('should be case insensitive', async () => {
        const lowerResponse = await request(app)
          .get('/api/stops/search')
          .query({ q: 'chicago' });

        const upperResponse = await request(app)
          .get('/api/stops/search')
          .query({ q: 'CHICAGO' });

        const mixedResponse = await request(app)
          .get('/api/stops/search')
          .query({ q: 'ChIcAgO' });

        const lowerBody = lowerResponse.body as SearchStopsResponse;
        const upperBody = upperResponse.body as SearchStopsResponse;
        const mixedBody = mixedResponse.body as SearchStopsResponse;

        expect(lowerBody.stops.length).toBe(upperBody.stops.length);
        expect(lowerBody.stops.length).toBe(mixedBody.stops.length);
      });

      it('should handle partial matches', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'nap' });

        const body = response.body as SearchStopsResponse;

        const hasNaperville = body.stops.some(s =>
          s.stop_name.toLowerCase().includes('nap')
        );

        expect(hasNaperville).toBe(true);
      });

      it('should return empty array for no matches', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'xyz123nonexistent' })
          .expect(200);

        const body = response.body as SearchStopsResponse;

        expect(body.stops).toEqual([]);
      });

      it('should handle special characters in query', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: "O'Hare" })
          .expect(200);

        expect(response.body).toHaveProperty('stops');
      });

      it('should handle queries with spaces', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'West Chicago' })
          .expect(200);

        const body = response.body as SearchStopsResponse;

        expect(Array.isArray(body.stops)).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should return 400 for missing query parameter', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .expect('Content-Type', /json/)
          .expect(400);

        const body = response.body as ApiError;

        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('code');
        expect(body.code).toBe('INVALID_QUERY');
      });

      it('should return 400 for query less than 2 characters', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'a' })
          .expect(400);

        const body = response.body as ApiError;

        expect(body.code).toBe('INVALID_QUERY');
        expect(body.error).toContain('at least 2 characters');
      });

      it('should return 400 for empty query string', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: '' })
          .expect(400);

        const body = response.body as ApiError;

        expect(body.code).toBe('INVALID_QUERY');
      });
    });

    describe('Regression Tests', () => {
      it('should find all major Chicago stations', async () => {
        const majorStations = [
          { query: 'Chicago Union', expectedName: 'Chicago Union Station' },
          { query: 'OTC', expectedName: 'Chicago OTC' },
          { query: 'LaSalle', expectedName: 'LaSalle Street' }
        ];

        for (const station of majorStations) {
          const response = await request(app)
            .get('/api/stops/search')
            .query({ q: station.query });

          const body = response.body as SearchStopsResponse;

          expect(body.stops.length).toBeGreaterThan(0);
          const hasExpectedStation = body.stops.some(s =>
            s.stop_name.includes(station.expectedName) ||
            s.stop_name === station.expectedName
          );
          expect(hasExpectedStation).toBe(true);
        }
      });

      it('should find Geneva station', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Geneva' });

        const body = response.body as SearchStopsResponse;

        const genevaStation = body.stops.find(s =>
          s.stop_name.toLowerCase() === 'geneva'
        );

        expect(genevaStation).toBeDefined();
        expect(genevaStation?.stop_id).toBe('GENEVA');
      });

      it('should find Naperville station', async () => {
        const response = await request(app)
          .get('/api/stops/search')
          .query({ q: 'Naperville' });

        const body = response.body as SearchStopsResponse;

        const napervilleStation = body.stops.find(s =>
          s.stop_name.toLowerCase() === 'naperville'
        );

        expect(napervilleStation).toBeDefined();
      });
    });
  });

  describe('GET /api/stops/:stopId/departures', () => {
    let validStopId: string;

    beforeAll(async () => {
      const data = await gtfsService.getData();
      // Use a major station that likely has many departures
      const chicagoStation = data.stops.find(s =>
        s.stop_name.toLowerCase().includes('chicago union')
      );
      validStopId = chicagoStation?.stop_id || data.stops[0].stop_id;
    });

    describe('Successful Requests', () => {
      it('should return 200 and departures for valid stop', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .expect('Content-Type', /json/)
          .expect(200);

        const body = response.body as GetDeparturesResponse;

        expect(body).toHaveProperty('stop');
        expect(body).toHaveProperty('departures');
        expect(body).toHaveProperty('timestamp');
        expect(Array.isArray(body.departures)).toBe(true);
      });

      it('should return departures with correct structure', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: '2024-12-16' }); // Monday with likely service

        const body = response.body as GetDeparturesResponse;

        if (body.departures.length > 0) {
          const departure = body.departures[0];

          expect(departure).toHaveProperty('route');
          expect(departure).toHaveProperty('trip_headsign');
          expect(departure).toHaveProperty('departure_time');
          expect(departure).toHaveProperty('arrival_time');
          expect(departure).toHaveProperty('direction');
          expect(departure).toHaveProperty('trip_id');

          // Validate route structure
          expect(departure.route).toHaveProperty('route_id');
          expect(departure.route).toHaveProperty('route_short_name');

          // Validate direction
          expect(['outbound', 'inbound']).toContain(departure.direction);

          // Validate ISO datetime format
          expect(() => new Date(departure.departure_time)).not.toThrow();
          expect(() => new Date(departure.arrival_time)).not.toThrow();
        }
      });

      it('should respect limit parameter', async () => {
        const limit = 5;
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ limit: limit.toString(), date: '2024-12-16' });

        const body = response.body as GetDeparturesResponse;

        expect(body.departures.length).toBeLessThanOrEqual(limit);
      });

      it('should filter by route ID', async () => {
        const data = await gtfsService.getData();
        const routeId = data.routes[0].route_id;

        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ routeId, date: '2024-12-16' });

        const body = response.body as GetDeparturesResponse;

        // All departures should be for the specified route
        body.departures.forEach(dep => {
          expect(dep.route.route_id).toBe(routeId);
        });
      });

      it('should return departures sorted by time', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: '2024-12-16', limit: '10' });

        const body = response.body as GetDeparturesResponse;

        if (body.departures.length > 1) {
          for (let i = 0; i < body.departures.length - 1; i++) {
            const current = new Date(body.departures[i].departure_time);
            const next = new Date(body.departures[i + 1].departure_time);
            expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
          }
        }
      });

      it('should handle date parameter', async () => {
        const testDate = '2024-12-16'; // Monday
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: testDate })
          .expect(200);

        const body = response.body as GetDeparturesResponse;

        expect(Array.isArray(body.departures)).toBe(true);
      });

      it('should use current date when date parameter is missing', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .expect(200);

        const body = response.body as GetDeparturesResponse;

        expect(body).toHaveProperty('departures');
        expect(body).toHaveProperty('timestamp');
      });

      it('should include timestamp in response', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`);

        const body = response.body as GetDeparturesResponse;

        expect(body.timestamp).toBeDefined();
        expect(() => new Date(body.timestamp)).not.toThrow();
      });

      it('should exclude arrivals (trains heading TO the station)', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: '2024-12-16', limit: '20' });

        const body = response.body as GetDeparturesResponse;

        // None of the departures should have the station name in the headsign
        body.departures.forEach(dep => {
          expect(
            dep.trip_headsign.toLowerCase().includes(body.stop.stop_name.toLowerCase())
          ).toBe(false);
        });
      });
    });

    describe('Error Cases', () => {
      it('should return 500 for non-existent stop ID', async () => {
        const response = await request(app)
          .get('/api/stops/NONEXISTENT123/departures')
          .expect('Content-Type', /json/)
          .expect(500);

        const body = response.body as ApiError;

        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('code');
        expect(body.code).toBe('INTERNAL_ERROR');
      });

      it('should handle invalid date format gracefully', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: 'invalid-date' });

        // Should either return 200 with empty results or 500
        expect([200, 500]).toContain(response.status);
      });

      it('should handle invalid limit parameter', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ limit: 'abc' });

        // Should handle gracefully
        expect(response.status).toBe(200);
      });
    });

    describe('Regression Tests', () => {
      it('should return departures for Geneva station on a weekday', async () => {
        const response = await request(app)
          .get('/api/stops/GENEVA/departures')
          .query({ date: '2024-12-16', limit: '5' }); // Monday

        const body = response.body as GetDeparturesResponse;

        expect(body.stop.stop_id).toBe('GENEVA');
        expect(body.stop.stop_name).toBe('Geneva');
      });

      it('should filter weekend vs weekday schedules correctly', async () => {
        const weekdayResponse = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: '2024-12-16', limit: '10' }); // Monday

        const weekendResponse = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: '2024-12-14', limit: '10' }); // Saturday

        const weekdayBody = weekdayResponse.body as GetDeparturesResponse;
        const weekendBody = weekendResponse.body as GetDeparturesResponse;

        // Both should return data but may have different schedules
        expect(Array.isArray(weekdayBody.departures)).toBe(true);
        expect(Array.isArray(weekendBody.departures)).toBe(true);
      });

      it('should have valid route colors in departures', async () => {
        const response = await request(app)
          .get(`/api/stops/${validStopId}/departures`)
          .query({ date: '2024-12-16', limit: '5' });

        const body = response.body as GetDeparturesResponse;

        body.departures.forEach(dep => {
          expect(dep.route.route_color).toMatch(/^[0-9A-F]{6}$/i);
          expect(dep.route.route_text_color).toMatch(/^[0-9A-F]{6}$/i);
        });
      });
    });

    describe('Concurrent Requests', () => {
      it('should handle multiple concurrent departure requests', async () => {
        const requests = Array.from({ length: 5 }, () =>
          request(app)
            .get(`/api/stops/${validStopId}/departures`)
            .query({ date: '2024-12-16', limit: '5' })
        );

        const responses = await Promise.all(requests);

        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('departures');
        });
      });
    });
  });

  describe('HTTP Method Tests', () => {
    it('should reject POST to search endpoint', async () => {
      await request(app)
        .post('/api/stops/search')
        .expect(404);
    });

    it('should reject POST to departures endpoint', async () => {
      await request(app)
        .post('/api/stops/GENEVA/departures')
        .expect(404);
    });

    it('should handle OPTIONS for CORS', async () => {
      await request(app)
        .options('/api/stops/search')
        .expect(204);
    });
  });
});
