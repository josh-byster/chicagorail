import { Route, Stop, Trip, StopTime, TripWithStops, ServicePeriod, StopTimeWithStop } from '../types/metra';

export class MetraService {
  private static instance: MetraService;
  private routes: Route[] = [];
  private stops: Stop[] = [];
  private trips: Trip[] = [];
  private stopTimes: StopTime[] = [];
  private servicePeriods: ServicePeriod[] = [];
  private selectedDate: Date = new Date();
  private tripsWithStopsCache: Map<string, TripWithStops[]> = new Map();
  private loadingCache: Map<string, Promise<TripWithStops[]>> = new Map();
  private lastLoadedDate: string | null = null;
  private stopSearchCache: Map<string, { stops: Stop[]; routes: Route[] }> = new Map();
  private readonly API_BASE_URL = import.meta.env.PROD 
    ? 'https://metra-tracker.joshbyster.com/api'
    : 'http://localhost:3000/api';
  private stopNameMap: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): MetraService {
    if (!MetraService.instance) {
      MetraService.instance = new MetraService();
    }
    return MetraService.instance;
  }

  public setSelectedDate(date: Date): void {
    // Ensure the date is set to noon in the local timezone to avoid any timezone issues
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);
    
    const newDateStr = localDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .split('/')
      .map(n => n.padStart(2, '0'))
      .join('-');
    const oldDateStr = this.selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .split('/')
      .map(n => n.padStart(2, '0'))
      .join('-');
    
    // Only clear cache if the date actually changed
    if (newDateStr !== oldDateStr) {
      console.log('[MetraService] Date changed, clearing trips cache');
      this.tripsWithStopsCache.clear();
      this.loadingCache.clear();
    }
    
    this.selectedDate = localDate;
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

  public async getRoutes(): Promise<Route[]> {
    try {
      // Check if we already have routes loaded
      if (this.routes.length > 0) {
        console.log('[MetraService] Routes cache hit, returning cached routes');
        return this.routes;
      }

      console.log('[MetraService] Routes cache miss, fetching from API');
      const response = await fetch(`${this.API_BASE_URL}/routes`);
      if (!response.ok) {
        throw new Error('Failed to fetch routes from backend');
      }
      const data = await response.json();
      this.routes = data;
      console.log('[MetraService] Routes fetched and cached successfully');
      return data;
    } catch (error) {
      console.error('[MetraService] Error fetching routes:', error);
      throw error;
    }
  }

  public getStops(): Stop[] {
    return this.stops;
  }

  public async getTripsByRoute(routeId: string): Promise<TripWithStops[]> {
    try {
      // Format the date in YYYY-MM-DD format in local timezone
      const dateStr = this.selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        .split('/')
        .map(n => n.padStart(2, '0'))
        .join('-');
      const cacheKey = `${routeId}-${dateStr}`;
      
      // Check if we have cached data
      if (this.tripsWithStopsCache.has(cacheKey)) {
        console.log(`[MetraService] Trips cache hit for ${cacheKey}`);
        return this.tripsWithStopsCache.get(cacheKey)!;
      }

      // Check if we have a loading promise
      if (this.loadingCache.has(cacheKey)) {
        console.log(`[MetraService] Using existing loading promise for ${cacheKey}`);
        return this.loadingCache.get(cacheKey)!;
      }

      console.log(`[MetraService] Fetching trips for ${cacheKey}`);
      const loadingPromise = fetch(
        `${this.API_BASE_URL}/routes/${routeId}/trips?date=${dateStr}`
      ).then(async response => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch trips from backend: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format: expected an array of trips');
        }
        
        // Cache the results
        this.tripsWithStopsCache.set(cacheKey, data);
        this.loadingCache.delete(cacheKey);
        console.log(`[MetraService] Trips fetched and cached successfully for ${cacheKey}`);
        return data;
      }).catch(error => {
        this.loadingCache.delete(cacheKey);
        throw error;
      });

      // Store the loading promise
      this.loadingCache.set(cacheKey, loadingPromise);
      
      return loadingPromise;
    } catch (error) {
      console.error('[MetraService] Error fetching trips:', error);
      throw error;
    }
  }

  public getStopById(stopId: string): Stop | undefined {
    return this.stops.find(stop => stop.stop_id === stopId);
  }

  public async searchStops(query: string): Promise<{ stops: Stop[]; routes: Route[] }> {
    try {
      // Check cache first
      if (this.stopSearchCache.has(query)) {
        console.log('[MetraService] Stop search cache hit for:', query);
        return this.stopSearchCache.get(query)!;
      }

      console.log('[MetraService] Stop search cache miss for:', query);
      const response = await fetch(`${this.API_BASE_URL}/search/stops?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search stops');
      }
      const result = await response.json();
      
      // Cache the result
      this.stopSearchCache.set(query, result);
      return result;
    } catch (error) {
      console.error('Error searching stops:', error);
      throw error;
    }
  }

  public async getTrips(routeId: string, date: Date): Promise<Trip[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/routes/${routeId}/trips?date=${date.toISOString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      return data.trips;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  }
} 