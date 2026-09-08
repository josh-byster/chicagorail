// GTFS Domain Types
import { RealtimePrediction } from './realtime';

export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  route_color: string;
  route_text_color: string;
  route_url: string;
}

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_desc: string;
  stop_lat: number;
  stop_lon: number;
  wheelchair_boarding: number;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  trip_headsign: string;
  direction_id: number;
  service_id: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

export interface Departure {
  route: Route;
  trip_headsign: string;
  departure_time: string;
  arrival_time: string;
  direction: 'inbound' | 'outbound';
  trip_id: string;
  /** Present only when the realtime feed has this trip */
  realtime?: RealtimePrediction;
}

export interface Arrival {
  route: Route;
  trip_headsign: string;
  arrival_time: string;
  departure_time: string;
  direction: 'inbound' | 'outbound';
  trip_id: string;
  /** Name of the stop this train started from */
  origin_name: string;
  /** Present only when the realtime feed has this trip */
  realtime?: RealtimePrediction;
}

export interface TripStop {
  stop: Stop;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
  /** Present only when the realtime feed has this trip */
  realtime?: RealtimePrediction;
}
