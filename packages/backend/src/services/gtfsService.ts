import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import type { Route, Stop, Trip, StopTime, Departure } from '@chicagorail/shared';
import { winstonLogger } from '../middleware/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface GTFSData {
  routes: Route[];
  stops: Stop[];
  trips: Trip[];
  stopTimes: StopTime[];
  servicePeriods: ServicePeriod[];
  lastUpdated: string;
}

export class GTFSService {
  private static instance: GTFSService;
  private data: GTFSData | null = null;
  private lastFetchTime: number | null = null;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly GTFS_URL = 'https://schedules.metrarail.com/gtfs/schedule.zip';
  private readonly GTFS_DIR = path.join(__dirname, '..', '..', '..', '..', 'schedule');
  private stopsByIdMap: Map<string, Stop> = new Map();
  private routesByStopMap: Map<string, Set<string>> = new Map();

  private constructor() {
    if (!fs.existsSync(this.GTFS_DIR)) {
      fs.mkdirSync(this.GTFS_DIR, { recursive: true });
    }
  }

  public static getInstance(): GTFSService {
    if (!GTFSService.instance) {
      GTFSService.instance = new GTFSService();
    }
    return GTFSService.instance;
  }

  private async downloadGTFSData(): Promise<void> {
    try {
      winstonLogger.info('Downloading GTFS data...');
      const response = await fetch(this.GTFS_URL);
      if (!response.ok) {
        throw new Error('Failed to download GTFS data');
      }

      const zipBuffer = await response.buffer();
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(this.GTFS_DIR, true);

      this.data = {
        routes: [],
        stops: [],
        trips: [],
        stopTimes: [],
        servicePeriods: [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      winstonLogger.error('Error downloading GTFS data:', error);
      throw error;
    }
  }

  public async loadData(): Promise<void> {
    try {
      if (this.data && this.lastFetchTime && Date.now() - this.lastFetchTime < this.CACHE_TTL) {
        winstonLogger.info('Using cached GTFS data');
        return;
      }

      const tripsFile = path.join(this.GTFS_DIR, 'trips.txt');
      if (!fs.existsSync(tripsFile)) {
        await this.downloadGTFSData();
      }

      const trips = this.parseCSVFile<Trip>('trips.txt', (row: any) => ({
        trip_id: row.trip_id,
        route_id: row.route_id,
        trip_headsign: row.trip_headsign,
        direction_id: parseInt(row.direction_id),
        service_id: row.service_id
      }));

      const stopTimes = this.parseCSVFile<StopTime>('stop_times.txt', (row: any) => ({
        trip_id: row.trip_id,
        arrival_time: row.arrival_time,
        departure_time: row.departure_time,
        stop_id: row.stop_id,
        stop_sequence: parseInt(row.stop_sequence)
      }));

      const routes = this.parseCSVFile<Route>('routes.txt', (row: any) => ({
        route_id: row.route_id,
        route_short_name: row.route_short_name,
        route_long_name: row.route_long_name,
        route_desc: row.route_desc,
        route_color: row.route_color,
        route_text_color: row.route_text_color,
        route_url: row.route_url
      }));

      const stops = this.parseCSVFile<Stop>('stops.txt', (row: any) => ({
        stop_id: row.stop_id,
        stop_name: row.stop_name,
        stop_desc: row.stop_desc,
        stop_lat: parseFloat(row.stop_lat),
        stop_lon: parseFloat(row.stop_lon),
        wheelchair_boarding: parseInt(row.wheelchair_boarding)
      }));

      const calendar = this.parseCSVFile<ServicePeriod>('calendar.txt', (row: any) => ({
        service_id: row.service_id,
        monday: parseInt(row.monday),
        tuesday: parseInt(row.tuesday),
        wednesday: parseInt(row.wednesday),
        thursday: parseInt(row.thursday),
        friday: parseInt(row.friday),
        saturday: parseInt(row.saturday),
        sunday: parseInt(row.sunday),
        start_date: row.start_date,
        end_date: row.end_date
      }));

      // Create indexes
      this.stopsByIdMap = new Map(stops.map(stop => [stop.stop_id, stop]));

      // Build routes by stop index
      this.routesByStopMap = new Map();
      trips.forEach(trip => {
        const tripStopTimes = stopTimes.filter(st => st.trip_id === trip.trip_id);
        tripStopTimes.forEach(st => {
          const stopRoutes = this.routesByStopMap.get(st.stop_id) || new Set();
          stopRoutes.add(trip.route_id);
          this.routesByStopMap.set(st.stop_id, stopRoutes);
        });
      });

      this.data = {
        trips,
        routes,
        stops,
        servicePeriods: calendar,
        stopTimes,
        lastUpdated: new Date().toISOString()
      };

      this.lastFetchTime = Date.now();
      winstonLogger.info('Loaded fresh GTFS data');
    } catch (error) {
      winstonLogger.error('Error loading GTFS data:', error);
      throw error;
    }
  }

  private parseCSVFile<T>(filename: string, rowMapper: (row: any) => T): T[] {
    const filePath = path.join(this.GTFS_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        const row = headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
          return obj;
        }, {} as Record<string, string>);
        return rowMapper(row);
      });
  }

  public async getData(): Promise<GTFSData> {
    if (!this.data) {
      await this.loadData();
    }
    if (!this.data) {
      throw new Error('Failed to load GTFS data');
    }
    return this.data;
  }

  // Convert GTFS time format (HH:MM:SS) to ISO datetime string
  private gtfsTimeToISO(gtfsTime: string, baseDate: Date): string {
    const [hours, minutes, seconds] = gtfsTime.split(':').map(Number);
    const date = new Date(baseDate);

    // Handle times >= 24:00:00 (next day service)
    if (hours >= 24) {
      date.setDate(date.getDate() + 1);
      date.setHours(hours - 24, minutes, seconds || 0);
    } else {
      date.setHours(hours, minutes, seconds || 0);
    }

    return date.toISOString();
  }

  public async getDeparturesForStop(
    stopId: string,
    date: Date,
    limit: number = 20,
    routeIdFilter?: string
  ): Promise<{ stop: Stop; departures: Departure[] }> {
    const data = await this.getData();
    const stop = data.stops.find(s => s.stop_id === stopId);

    if (!stop) {
      throw new Error('Stop not found');
    }

    // Get all stop times for this stop
    const stopTimes = data.stopTimes.filter(st => st.stop_id === stopId);

    // Build departures with route info
    const departures = stopTimes
      .map(st => {
        const trip = data.trips.find(t => t.trip_id === st.trip_id);
        if (!trip) return null;

        const route = data.routes.find(r => r.route_id === trip.route_id);
        if (!route) return null;

        if (routeIdFilter && route.route_id !== routeIdFilter) {
          return null;
        }

        return {
          route,
          trip_headsign: trip.trip_headsign,
          departure_time: this.gtfsTimeToISO(st.departure_time, date),
          arrival_time: this.gtfsTimeToISO(st.arrival_time, date),
          direction: trip.direction_id === 0 ? 'outbound' : 'inbound',
          trip_id: trip.trip_id
        } as Departure;
      })
      .filter((d): d is Departure => d !== null)
      .slice(0, limit);

    return { stop, departures };
  }

  public getRoutesForStops(stops: Stop[]): Route[] {
    if (!this.data) {
      throw new Error('GTFS data not loaded');
    }

    const routeIds = new Set<string>();

    stops.forEach(stop => {
      const stopRoutes = this.routesByStopMap.get(stop.stop_id);
      if (stopRoutes) {
        stopRoutes.forEach(routeId => routeIds.add(routeId));
      }
    });

    return Array.from(routeIds)
      .map(routeId => this.data!.routes.find(r => r.route_id === routeId))
      .filter((route): route is Route => route !== undefined);
  }
}
