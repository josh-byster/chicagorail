/**
 * Type-safe API client for Chicago Rail backend
 *
 * Features:
 * - Centralized error handling with custom error types
 * - Type-safe request/response handling
 * - Configurable defaults from config module
 * - Logging for debugging
 */

import type {
  GetRoutesResponse,
  SearchStopsResponse,
  GetDeparturesResponse,
  FindDirectTripsResponse,
  GetSystemInfoResponse,
  GetTripDetailsResponse,
  ApiError as ApiErrorResponse,
} from '@chicagorail/shared';
import { API_CONFIG } from '@/config';
import { ApiError, NetworkError, logger } from '@/shared/lib';

interface RequestOptions {
  signal?: AbortSignal;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Core fetch wrapper with error handling
   */
  private async fetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: options.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ApiError || error instanceof NetworkError) {
        throw error;
      }

      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      // Network or other fetch error
      logger.error('Network request failed', error instanceof Error ? error : undefined, { url });
      throw new NetworkError('Unable to connect to server');
    }
  }

  /**
   * Parse and throw appropriate error from response
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: ApiErrorResponse | null = null;

    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    const message = errorData?.error ?? `Request failed with status ${response.status}`;
    const code = errorData?.code ?? 'UNKNOWN_ERROR';

    logger.error('API error response', undefined, {
      status: response.status,
      code,
      message,
    });

    throw new ApiError(message, code, response.status, errorData);
  }

  /**
   * Get all Metra routes
   */
  async getRoutes(options?: RequestOptions): Promise<GetRoutesResponse> {
    return this.fetch<GetRoutesResponse>('/routes', options);
  }

  /**
   * Search for stations by name
   */
  async searchStops(query: string, options?: RequestOptions): Promise<SearchStopsResponse> {
    const endpoint = `/stops/search?q=${encodeURIComponent(query)}`;
    return this.fetch<SearchStopsResponse>(endpoint, options);
  }

  /**
   * Get departures from a station
   */
  async getDepartures(
    stopId: string,
    params?: {
      routeId?: string;
      date?: string;
      limit?: number;
    },
    options?: RequestOptions
  ): Promise<GetDeparturesResponse> {
    const searchParams = new URLSearchParams();

    if (params?.routeId) {
      searchParams.set('routeId', params.routeId);
    }
    if (params?.date) {
      searchParams.set('date', params.date);
    }
    searchParams.set('limit', String(params?.limit ?? API_CONFIG.defaults.departuresLimit));

    const endpoint = `/stops/${encodeURIComponent(stopId)}/departures?${searchParams}`;
    return this.fetch<GetDeparturesResponse>(endpoint, options);
  }

  /**
   * Find direct trips between two stations
   */
  async findDirectTrips(
    originStopId: string,
    destinationStopId: string,
    params?: {
      date?: string;
      limit?: number;
    },
    options?: RequestOptions
  ): Promise<FindDirectTripsResponse> {
    const searchParams = new URLSearchParams({
      origin: originStopId,
      destination: destinationStopId,
      limit: String(params?.limit ?? API_CONFIG.defaults.tripsLimit),
    });

    if (params?.date) {
      searchParams.set('date', params.date);
    }

    return this.fetch<FindDirectTripsResponse>(`/trips/direct?${searchParams}`, options);
  }

  /**
   * Get system info (last GTFS update, etc.)
   */
  async getSystemInfo(options?: RequestOptions): Promise<GetSystemInfoResponse> {
    return this.fetch<GetSystemInfoResponse>('/system', options);
  }

  /**
   * Get details for a specific trip
   */
  async getTripDetails(
    tripId: string,
    date?: string,
    options?: RequestOptions
  ): Promise<GetTripDetailsResponse> {
    const params = new URLSearchParams();
    if (date) {
      params.set('date', date);
    }

    const query = params.toString();
    const endpoint = `/trips/${encodeURIComponent(tripId)}${query ? `?${query}` : ''}`;
    return this.fetch<GetTripDetailsResponse>(endpoint, options);
  }
}

/** Singleton API client instance */
export const api = new ApiClient();
