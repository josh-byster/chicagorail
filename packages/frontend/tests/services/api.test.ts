/**
 * Unit tests for API service
 * Tests HTTP client, error handling, and all API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchStations,
  fetchStation,
  fetchReachableStations,
  fetchLines,
  fetchLine,
  fetchTrains,
  fetchTrainDetail,
  fetchAlerts,
  fetchHealth,
  ApiError,
} from '../../src/services/api';

describe('api.service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Setup fetch mock for each test
    global.fetch = vi.fn();
  });

  describe('ApiError', () => {
    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 404);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ApiError');
    });

    it('should include optional data', () => {
      const data = { details: 'Additional info' };
      const error = new ApiError('Test error', 400, data);

      expect(error.data).toEqual(data);
    });
  });

  describe('fetchStations', () => {
    it('should fetch all stations', async () => {
      const mockStations = [
        { station_id: 'UNION', station_name: 'Union Station' },
        { station_id: 'OGILVIE', station_name: 'Ogilvie' },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStations,
      });

      const result = await fetchStations();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stations'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockStations);
    });

    it('should fetch stations filtered by line', async () => {
      const mockStations = [{ station_id: 'ST1', station_name: 'Station 1' }];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStations,
      });

      await fetchStations('BNSF');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stations?line_id=BNSF'),
        expect.any(Object)
      );
    });

    it('should encode line_id parameter', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchStations('LINE/WITH/SLASH');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('line_id=LINE%2FWITH%2FSLASH'),
        expect.any(Object)
      );
    });
  });

  describe('fetchStation', () => {
    it('should fetch single station by ID', async () => {
      const mockStation = {
        station_id: 'UNION',
        station_name: 'Union Station',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStation,
      });

      const result = await fetchStation('UNION');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stations/UNION'),
        expect.any(Object)
      );
      expect(result).toEqual(mockStation);
    });

    it('should encode station ID', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await fetchStation('ID/WITH/SLASH');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stations/ID%2FWITH%2FSLASH'),
        expect.any(Object)
      );
    });
  });

  describe('fetchReachableStations', () => {
    it('should fetch reachable stations from origin', async () => {
      const mockStations = [
        { station_id: 'DEST1', station_name: 'Destination 1' },
        { station_id: 'DEST2', station_name: 'Destination 2' },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStations,
      });

      const result = await fetchReachableStations('ORIGIN');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stations/ORIGIN/reachable'),
        expect.any(Object)
      );
      expect(result).toEqual(mockStations);
    });
  });

  describe('fetchLines', () => {
    it('should fetch all lines', async () => {
      const mockLines = [
        { line_id: 'BNSF', line_short_name: 'BNSF' },
        { line_id: 'UP-N', line_short_name: 'UP-N' },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLines,
      });

      const result = await fetchLines();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lines'),
        expect.any(Object)
      );
      expect(result).toEqual(mockLines);
    });
  });

  describe('fetchLine', () => {
    it('should fetch single line by ID', async () => {
      const mockLine = { line_id: 'BNSF', line_short_name: 'BNSF' };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLine,
      });

      const result = await fetchLine('BNSF');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lines/BNSF'),
        expect.any(Object)
      );
      expect(result).toEqual(mockLine);
    });
  });

  describe('fetchTrains', () => {
    it('should fetch trains with required parameters', async () => {
      const mockTrains = [{ trip_id: 'TRIP1', line_id: 'BNSF' }];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const result = await fetchTrains({
        origin: 'ORIGIN',
        destination: 'DEST',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/trains?origin=ORIGIN&destination=DEST'),
        expect.any(Object)
      );
      expect(result).toEqual(mockTrains);
    });

    it('should include optional parameters', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchTrains({
        origin: 'ORIGIN',
        destination: 'DEST',
        limit: 10,
        time: '14:30:00',
        date: '2025-01-15',
      });

      const callUrl = (fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('origin=ORIGIN');
      expect(callUrl).toContain('destination=DEST');
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('time=14%3A30%3A00');
      expect(callUrl).toContain('date=2025-01-15');
    });

    it('should omit undefined optional parameters', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchTrains({
        origin: 'ORIGIN',
        destination: 'DEST',
        limit: undefined,
        time: undefined,
        date: undefined,
      });

      const callUrl = (fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('origin=ORIGIN');
      expect(callUrl).toContain('destination=DEST');
      expect(callUrl).not.toContain('limit');
      expect(callUrl).not.toContain('time');
      expect(callUrl).not.toContain('date');
    });
  });

  describe('fetchTrainDetail', () => {
    it('should fetch single train by trip ID', async () => {
      const mockTrain = { trip_id: 'TRIP123', line_id: 'BNSF' };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrain,
      });

      const result = await fetchTrainDetail('TRIP123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/trains/TRIP123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockTrain);
    });
  });

  describe('fetchAlerts', () => {
    it('should fetch all alerts without filters', async () => {
      const mockAlerts = [{ alert_id: 'ALERT1', header_text: 'Alert 1' }];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAlerts,
      });

      const result = await fetchAlerts();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/alerts$/),
        expect.any(Object)
      );
      expect(result).toEqual(mockAlerts);
    });

    it('should filter by line_id', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAlerts({ lineId: 'BNSF' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts?line_id=BNSF'),
        expect.any(Object)
      );
    });

    it('should filter by station_id', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAlerts({ stationId: 'UNION' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/alerts?station_id=UNION'),
        expect.any(Object)
      );
    });

    it('should filter by both line_id and station_id', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchAlerts({ lineId: 'BNSF', stationId: 'UNION' });

      const callUrl = (fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('line_id=BNSF');
      expect(callUrl).toContain('station_id=UNION');
    });
  });

  describe('fetchHealth', () => {
    it('should fetch health status', async () => {
      const mockHealth = {
        status: 'healthy',
        gtfs_last_updated: '2025-01-15T00:00:00Z',
        gtfs_static_version: 'v1.0.0',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await fetchHealth();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
      expect(result).toEqual(mockHealth);
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError on HTTP error with JSON body', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      });

      try {
        await fetchStations();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Resource not found');
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).data).toEqual({
          message: 'Resource not found',
        });
      }
    });

    it('should throw ApiError on HTTP error without JSON body', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      try {
        await fetchStations();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain(
          'HTTP 500: Internal Server Error'
        );
        expect((error as ApiError).status).toBe(500);
      }
    });

    it('should throw ApiError on network error', async () => {
      (fetch as any).mockRejectedValue(new Error('Network failed'));

      try {
        await fetchStations();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Network failed');
        expect((error as ApiError).status).toBe(0);
      }
    });

    it('should throw ApiError on non-Error network failure', async () => {
      (fetch as any).mockRejectedValue('Unknown error');

      try {
        await fetchStations();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toContain('Network request failed');
        expect((error as ApiError).status).toBe(0);
      }
    });

    it('should preserve ApiError when thrown from fetch', async () => {
      const originalError = new ApiError('Original error', 401);
      (fetch as any).mockRejectedValue(originalError);

      try {
        await fetchStations();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBe(originalError);
        expect((error as ApiError).status).toBe(401);
      }
    });

    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 400, statusText: 'Bad Request' },
        { status: 401, statusText: 'Unauthorized' },
        { status: 403, statusText: 'Forbidden' },
        { status: 404, statusText: 'Not Found' },
        { status: 500, statusText: 'Internal Server Error' },
        { status: 503, statusText: 'Service Unavailable' },
      ];

      for (const { status, statusText } of testCases) {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status,
          statusText,
          json: async () => ({}),
        });

        try {
          await fetchStations();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).status).toBe(status);
        }
      }
    });
  });

  describe('Request configuration', () => {
    it('should include Content-Type header', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchStations();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use API base URL from environment', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchStations();

      const callUrl = (fetch as any).mock.calls[0][0];
      expect(callUrl).toMatch(/^https?:\/\//); // Should be a full URL
      expect(callUrl).toContain('/api/'); // Should include /api/ path
    });
  });
});
