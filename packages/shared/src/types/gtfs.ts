// GTFS Domain Types
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
}

export interface TripStop {
  stop: Stop;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
}
