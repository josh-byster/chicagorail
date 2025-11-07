/**
 * GTFS Type Definitions
 *
 * TypeScript interfaces for GTFS (General Transit Feed Specification) data structures.
 * Based on https://gtfs.org/reference/static/
 */

export interface GTFSAgency {
  agency_id: string;
  agency_name: string;
  agency_url?: string;
  agency_timezone?: string;
}

export interface GTFSRoute {
  route_id: string;
  route_short_name?: string;
  route_long_name?: string;
  route_type: number;
  route_color?: string;
  route_text_color?: string;
}

export interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_desc?: string;
  zone_id?: string;
  parent_station?: string;
}

export interface GTFSTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
}

export interface GTFSStopTime {
  trip_id: string;
  stop_id: string;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
  pickup_type?: number;
  drop_off_type?: number;
}

export interface GTFSCalendar {
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

export interface GTFSCalendarDate {
  service_id: string;
  date: string;
  exception_type: number;
}

export interface GTFSData {
  agencies: GTFSAgency[];
  routes: GTFSRoute[];
  stops: GTFSStop[];
  trips: GTFSTrip[];
  stopTimes: GTFSStopTime[];
  calendar: GTFSCalendar[];
  calendarDates: GTFSCalendarDate[];
}
