import type { Station, Line, Train } from '@metra/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or other fetch errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }
}

// Stations API
export async function fetchStations(lineId?: string): Promise<Station[]> {
  const query = lineId ? `?line_id=${encodeURIComponent(lineId)}` : '';
  return fetchApi<Station[]>(`/stations${query}`);
}

export async function fetchStation(stationId: string): Promise<Station> {
  return fetchApi<Station>(`/stations/${encodeURIComponent(stationId)}`);
}

// Lines API
export async function fetchLines(): Promise<Line[]> {
  return fetchApi<Line[]>('/lines');
}

export async function fetchLine(lineId: string): Promise<Line> {
  return fetchApi<Line>(`/lines/${encodeURIComponent(lineId)}`);
}

// Trains API
export async function fetchTrains(params: {
  origin: string;
  destination: string;
  limit?: number;
  time?: string;
}): Promise<Train[]> {
  const searchParams = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.time && { time: params.time }),
  });

  return fetchApi<Train[]>(`/trains?${searchParams}`);
}

export async function fetchTrainDetail(tripId: string): Promise<Train> {
  return fetchApi<Train>(`/trains/${encodeURIComponent(tripId)}`);
}

// Health API
export async function fetchHealth(): Promise<{
  status: string;
  gtfs_last_updated: string;
  gtfs_static_version: string;
}> {
  return fetchApi('/health');
}

export { ApiError };
