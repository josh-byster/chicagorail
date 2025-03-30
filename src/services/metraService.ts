import { Route, Stop, Trip, StopTime } from '../types/metra';

interface ServicePeriod {
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

interface StopTimeWithStop extends StopTime {
  stopName: string;
}

interface TripWithStops extends Trip {
  stopTimes: StopTimeWithStop[];
}

export class MetraService {
  private static instance: MetraService;
  private routes: Route[] = [];
  private stops: Stop[] = [];
  private trips: Trip[] = [];
  private stopTimes: StopTime[] = [];
  private servicePeriods: ServicePeriod[] = [];
  private selectedDate: Date = new Date();
  private tripsWithStopsCache: Map<string, TripWithStops[]> = new Map();
  private lastLoadedDate: string | null = null;

  private constructor() {}

  public static getInstance(): MetraService {
    if (!MetraService.instance) {
      MetraService.instance = new MetraService();
    }
    return MetraService.instance;
  }

  public setSelectedDate(date: Date) {
    this.selectedDate = date;
    // Clear cache when date changes
    this.tripsWithStopsCache.clear();
  }

  public getSelectedDate(): Date {
    return this.selectedDate;
  }

  public async loadData() {
    // Only load data if it hasn't been loaded yet
    if (this.routes.length === 0) {
      try {
        const [routesResponse, stopsResponse, tripsResponse, stopTimesResponse, calendarResponse] = await Promise.all([
          fetch('/schedule/routes.txt'),
          fetch('/schedule/stops.txt'),
          fetch('/schedule/trips.txt'),
          fetch('/schedule/stop_times.txt'),
          fetch('/schedule/calendar.txt')
        ]);

        const routesText = await routesResponse.text();
        const stopsText = await stopsResponse.text();
        const tripsText = await tripsResponse.text();
        const stopTimesText = await stopTimesResponse.text();
        const calendarText = await calendarResponse.text();

        this.routes = this.parseCSV(routesText).map(row => ({
          route_id: row.route_id,
          route_short_name: row.route_short_name,
          route_long_name: row.route_long_name,
          route_desc: row.route_desc,
          agency_id: row.agency_id,
          route_type: parseInt(row.route_type),
          route_color: row.route_color,
          route_text_color: row.route_text_color,
          route_url: row.route_url,
        }));

        this.stops = this.parseCSV(stopsText).map(row => ({
          stop_id: row.stop_id,
          stop_name: row.stop_name,
          stop_desc: row.stop_desc,
          stop_lat: parseFloat(row.stop_lat),
          stop_lon: parseFloat(row.stop_lon),
          zone_id: row.zone_id,
          stop_url: row.stop_url,
          wheelchair_boarding: parseInt(row.wheelchair_boarding),
        }));

        this.trips = this.parseCSV(tripsText).map(row => ({
          route_id: row.route_id,
          service_id: row.service_id,
          trip_id: row.trip_id,
          trip_headsign: row.trip_headsign,
          direction_id: parseInt(row.direction_id),
          block_id: row.block_id,
          shape_id: row.shape_id,
        }));

        this.stopTimes = this.parseCSV(stopTimesText).map(row => ({
          trip_id: row.trip_id,
          arrival_time: row.arrival_time,
          departure_time: row.departure_time,
          stop_id: row.stop_id,
          stop_sequence: parseInt(row.stop_sequence),
          pickup_type: parseInt(row.pickup_type),
          drop_off_type: parseInt(row.drop_off_type),
        }));

        this.servicePeriods = this.parseCSV(calendarText).map(row => ({
          service_id: row.service_id,
          monday: parseInt(row.monday),
          tuesday: parseInt(row.tuesday),
          wednesday: parseInt(row.wednesday),
          thursday: parseInt(row.thursday),
          friday: parseInt(row.friday),
          saturday: parseInt(row.saturday),
          sunday: parseInt(row.sunday),
          start_date: row.start_date,
          end_date: row.end_date,
        }));

        // Create a map of stop IDs to stop names for faster lookups
        this.stopNameMap = new Map(
          this.stops.map(stop => [stop.stop_id, stop.stop_name])
        );
      } catch (error) {
        console.error('Error loading Metra data:', error);
        throw error;
      }
    }
  }

  private stopNameMap: Map<string, string> = new Map();

  private parseCSV(text: string) {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
        return obj;
      }, {} as Record<string, string>);
    });
  }

  private getActiveServiceIds(): string[] {
    const date = this.selectedDate;
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDate = date.toISOString().split('T')[0].replace(/-/g, '');

    return this.servicePeriods
      .filter(period => {
        const isInDateRange = currentDate >= period.start_date && currentDate <= period.end_date;
        if (!isInDateRange) return false;

        switch (dayOfWeek) {
          case 0: return period.sunday === 1;
          case 1: return period.monday === 1;
          case 2: return period.tuesday === 1;
          case 3: return period.wednesday === 1;
          case 4: return period.thursday === 1;
          case 5: return period.friday === 1;
          case 6: return period.saturday === 1;
          default: return false;
        }
      })
      .map(period => period.service_id);
  }

  public getRoutes(): Route[] {
    return this.routes;
  }

  public getStops(): Stop[] {
    return this.stops;
  }

  public getTripsByRoute(routeId: string): TripWithStops[] {
    // Check cache first
    const cacheKey = `${routeId}-${this.selectedDate.toISOString().split('T')[0]}`;
    if (this.tripsWithStopsCache.has(cacheKey)) {
      return this.tripsWithStopsCache.get(cacheKey)!;
    }

    const activeServiceIds = this.getActiveServiceIds();
    const trips = this.trips.filter(trip => 
      trip.route_id === routeId && 
      activeServiceIds.includes(trip.service_id)
    );

    // Pre-calculate stop times for all trips
    const tripsWithStops = trips.map(trip => ({
      ...trip,
      stopTimes: this.stopTimes
        .filter(stopTime => stopTime.trip_id === trip.trip_id)
        .map(stopTime => ({
          ...stopTime,
          stopName: this.stopNameMap.get(stopTime.stop_id) || 'Unknown Stop',
        }))
        .sort((a, b) => a.stop_sequence - b.stop_sequence),
    }));

    // Cache the result
    this.tripsWithStopsCache.set(cacheKey, tripsWithStops);
    return tripsWithStops;
  }

  public getStopById(stopId: string): Stop | undefined {
    return this.stops.find(stop => stop.stop_id === stopId);
  }
} 