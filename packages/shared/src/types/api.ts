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

// GET /api/trips/direct?origin=&destination=&limit=
export interface FindDirectTripsRequest {
  origin: string; // origin stop_id
  destination: string; // destination stop_id
  limit?: number;
}

export interface DirectTrip {
  route: Route;
  trip_id: string;
  trip_headsign: string;
  origin_departure: string; // ISO datetime
  destination_arrival: string; // ISO datetime
  duration_minutes: number;
}

export interface FindDirectTripsResponse {
  origin: Stop;
  destination: Stop;
  trips: DirectTrip[];
}

// Error response
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}
