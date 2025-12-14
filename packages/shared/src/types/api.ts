// API Request/Response Types
import { Route, Stop, Departure } from './gtfs';

// GET /api/routes
export interface GetRoutesResponse {
  routes: Route[];
}

// GET /api/search/stops?q=
export interface SearchStopsRequest {
  q: string;
}

export interface SearchStopsResponse {
  stops: Stop[];
}

// GET /api/stops/:stopId/departures?date=&limit=
export interface GetDeparturesRequest {
  stopId: string;
  date?: string; // ISO date string
  limit?: number;
  routeId?: string; // Optional route filter
}

export interface GetDeparturesResponse {
  stop: Stop;
  departures: Departure[];
  timestamp: string;
}

// Error response
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
