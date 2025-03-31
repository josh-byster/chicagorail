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
  stop_desc: string;
  stop_lat: number;
  stop_lon: number;
  zone_id: string;
  stop_url: string;
  wheelchair_boarding: number;
}

export interface Trip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign: string;
  direction_id: number;
  block_id: string;
  shape_id: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  pickup_type: number;
  drop_off_type: number;
}

export interface StopTimeWithStop extends StopTime {
  stopName: string;
}

export interface TripWithStops extends Trip {
  stopTimes: StopTimeWithStop[];
}

export interface ServicePeriod {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string;
  end_date: string;
}

export interface GTFSData {
  routes: Route[];
  stops: Stop[];
  trips: TripWithStops[];
  stopTimes: StopTimeWithStop[];
  servicePeriods: ServicePeriod[];
  lastUpdated: string;
} 