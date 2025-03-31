export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_desc: string;
  agency_id: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
  route_url: string;
}

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

export interface StopTime {
  trip_id: string;
  stop_id: string;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
}

export interface StopTimeWithStop extends StopTime {
  stopName: string;
  pickup_type: number;
  drop_off_type: number;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  service_id: string;
  direction_id: number;
  shape_id: string;
}

export interface TripWithStops extends Trip {
  stopTimes: StopTimeWithStop[];
}

export interface ServicePeriod {
  service_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string;
  end_date: string;
} 