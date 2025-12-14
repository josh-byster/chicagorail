import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/testApp.js';

describe('Health Check and API Integration Tests', () => {
  const app = createTestApp();

  describe('GET /api/health', () => {
    it('should return 200 status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should handle concurrent health checks', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should return 404 for root path', async () => {
      const response = await request(app)
        .get('/')
        .expect(404);
    });

    it('should return 404 for /api without endpoint', async () => {
      const response = await request(app)
        .get('/api')
        .expect(404);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/routes')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON content-type for API endpoints', async () => {
      const endpoints = [
        '/api/health',
        '/api/routes',
        '/api/stops/search?q=Chicago'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });
  });

  describe('Request Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      // Even though our API doesn't use POST with JSON, we test the middleware
      const response = await request(app)
        .post('/api/routes')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Should be 404 (route not found) not 400 (bad request)
      // This confirms JSON parsing is working
      expect(response.status).toBe(404);
    });
  });

  describe('API Response Times', () => {
    it('should respond to health check within reasonable time', async () => {
      const start = Date.now();
      await request(app).get('/api/health');
      const duration = Date.now() - start;

      // Health check should be very fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should respond to routes request within reasonable time', async () => {
      const start = Date.now();
      await request(app).get('/api/routes');
      const duration = Date.now() - start;

      // Routes should respond quickly (< 1000ms even with file I/O)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('API Stability', () => {
    it('should handle rapid sequential requests', async () => {
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(request(app).get('/api/health'));
      }

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain state across requests', async () => {
      // First request
      const response1 = await request(app).get('/api/routes');
      const routes1 = response1.body.routes;

      // Second request
      const response2 = await request(app).get('/api/routes');
      const routes2 = response2.body.routes;

      // Should return the same data
      expect(routes1.length).toBe(routes2.length);
      expect(routes1[0].route_id).toBe(routes2[0].route_id);
    });
  });
});
