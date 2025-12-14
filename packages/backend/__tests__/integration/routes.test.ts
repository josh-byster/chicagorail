import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/testApp.js';
import { GTFSService } from '../../src/services/gtfsService.js';
import type { GetRoutesResponse, ApiError } from '@chicagorail/shared';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GTFS_FIXTURES_DIR = path.join(__dirname, '..', 'fixtures', 'gtfs');

describe('Routes API Integration Tests', () => {
  const app = createTestApp();
  let gtfsService: GTFSService;

  beforeAll(async () => {
    // Setup GTFS service with fixture data
    gtfsService = GTFSService.getInstance();
    (gtfsService as any).GTFS_DIR = GTFS_FIXTURES_DIR;
    await gtfsService.loadData();
  });

  describe('GET /api/routes', () => {
    it('should return 200 and routes data', async () => {
      const response = await request(app)
        .get('/api/routes')
        .expect('Content-Type', /json/)
        .expect(200);

      const body = response.body as GetRoutesResponse;

      expect(body).toHaveProperty('routes');
      expect(Array.isArray(body.routes)).toBe(true);
      expect(body.routes.length).toBeGreaterThan(0);
    });

    it('should return routes with correct structure', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;
      const route = body.routes[0];

      expect(route).toHaveProperty('route_id');
      expect(route).toHaveProperty('route_short_name');
      expect(route).toHaveProperty('route_long_name');
      expect(route).toHaveProperty('route_desc');
      expect(route).toHaveProperty('route_color');
      expect(route).toHaveProperty('route_text_color');
      expect(route).toHaveProperty('route_url');
    });

    it('should return all Metra lines', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;
      const routeShortNames = body.routes.map(r => r.route_short_name);

      // Test for common Metra lines
      const expectedLines = ['BNSF', 'UP-N', 'UP-NW', 'UP-W', 'MD-N', 'MD-W', 'NCS', 'HC', 'ME', 'RI', 'SWS'];

      expectedLines.forEach(line => {
        expect(routeShortNames).toContain(line);
      });
    });

    it('should return routes with valid colors', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;

      body.routes.forEach(route => {
        // Route color should be a 6-character hex code
        expect(route.route_color).toMatch(/^[0-9A-F]{6}$/i);
        expect(route.route_text_color).toMatch(/^[0-9A-F]{6}$/i);
      });
    });

    it('should return routes with URLs', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;

      body.routes.forEach(route => {
        expect(route.route_url).toBeDefined();
        expect(route.route_url).toContain('metrarail.com');
      });
    });

    it('should have consistent data across multiple requests', async () => {
      const response1 = await request(app).get('/api/routes');
      const response2 = await request(app).get('/api/routes');

      const body1 = response1.body as GetRoutesResponse;
      const body2 = response2.body as GetRoutesResponse;

      expect(body1.routes.length).toBe(body2.routes.length);
      expect(body1.routes[0].route_id).toBe(body2.routes[0].route_id);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app).get('/api/routes')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.routes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Routes API Regression Tests', () => {
    it('should return BNSF route with correct properties', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;
      const bnsfRoute = body.routes.find(r => r.route_short_name === 'BNSF');

      expect(bnsfRoute).toBeDefined();
      expect(bnsfRoute?.route_long_name).toBe('Burlington Northern');
      expect(bnsfRoute?.route_color).toBe('29C233');
      expect(bnsfRoute?.route_text_color).toBe('000000');
    });

    it('should return Metra Electric route with correct properties', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;
      const meRoute = body.routes.find(r => r.route_short_name === 'ME');

      expect(meRoute).toBeDefined();
      expect(meRoute?.route_long_name).toContain('Electric');
    });

    it('should return Union Pacific North route with correct properties', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;
      const upnRoute = body.routes.find(r => r.route_short_name === 'UP-N');

      expect(upnRoute).toBeDefined();
      expect(upnRoute?.route_long_name).toContain('Union Pacific');
    });

    it('should return exactly 11 Metra routes', async () => {
      const response = await request(app).get('/api/routes');

      const body = response.body as GetRoutesResponse;

      // Metra has 11 lines
      expect(body.routes.length).toBe(11);
    });
  });

  describe('Routes API Error Handling', () => {
    it('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/routes')
        .expect(204);
    });

    it('should reject POST requests', async () => {
      const response = await request(app)
        .post('/api/routes')
        .expect(404);
    });

    it('should reject PUT requests', async () => {
      const response = await request(app)
        .put('/api/routes')
        .expect(404);
    });

    it('should reject DELETE requests', async () => {
      const response = await request(app)
        .delete('/api/routes')
        .expect(404);
    });
  });
});
