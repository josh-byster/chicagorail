import type {
  GetRoutesResponse,
  SearchStopsResponse,
  GetDeparturesResponse,
  FindDirectTripsResponse,
  GetSystemInfoResponse,
  GetTripDetailsResponse,
  ApiError
} from '@chicagorail/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error);
    }

    return response.json();
  }

  async getRoutes() {
    return this.fetch<GetRoutesResponse>('/routes');
  }

  async searchStops(query: string) {
    return this.fetch<SearchStopsResponse>(`/stops/search?q=${encodeURIComponent(query)}`);
  }

  async getDepartures(stopId: string, routeId?: string, date?: string, limit: number = 100) {
    const params = new URLSearchParams();
    if (routeId) params.set('routeId', routeId);
    if (date) params.set('date', date);
    params.set('limit', limit.toString());

    const endpoint = `/stops/${stopId}/departures?${params}`;
    return this.fetch<GetDeparturesResponse>(endpoint);
  }

  async findDirectTrips(originStopId: string, destinationStopId: string, date?: string, limit: number = 10) {
    const params = new URLSearchParams({
      origin: originStopId,
      destination: destinationStopId,
      limit: limit.toString()
    });
    if (date) params.set('date', date);

    return this.fetch<FindDirectTripsResponse>(`/trips/direct?${params}`);
  }

  async getSystemInfo() {
    return this.fetch<GetSystemInfoResponse>('/system');
  }

  async getTripDetails(tripId: string, date?: string) {
    const params = new URLSearchParams();
    if (date) params.set('date', date);

    const query = params.toString();
    const endpoint = `/trips/${encodeURIComponent(tripId)}${query ? `?${query}` : ''}`;
    return this.fetch<GetTripDetailsResponse>(endpoint);
  }
}

export const api = new ApiClient();
