import type {
  GetRoutesResponse,
  SearchStopsResponse,
  GetDeparturesResponse,
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

  async getDepartures(stopId: string, routeId?: string) {
    const params = new URLSearchParams();
    if (routeId) params.set('routeId', routeId);

    const endpoint = `/stops/${stopId}/departures?${params}`;
    return this.fetch<GetDeparturesResponse>(endpoint);
  }
}

export const api = new ApiClient();
