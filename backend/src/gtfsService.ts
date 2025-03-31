import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import { GTFSData, Route, Stop, Trip, StopTime, ServicePeriod, StopTimeWithStop, TripWithStops } from './types';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export class GTFSService {
  private static instance: GTFSService;
  private data: GTFSData | null = null;
  private lastFetchTime: number | null = null;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly GTFS_URL = 'https://schedules.metrarail.com/gtfs/schedule.zip';
  private readonly GTFS_DIR = path.join(__dirname, '..', 'schedule');

  private constructor() {
    // Create schedule directory if it doesn't exist
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
      logger.info('Downloading GTFS data...');
      const response = await fetch(this.GTFS_URL);
      if (!response.ok) {
        throw new Error('Failed to download GTFS data');
      }

      const buffer = await response.buffer();
      const zip = new AdmZip(buffer);
      
      // Extract all files to the schedule directory
      zip.extractAllTo(this.GTFS_DIR, true);
      logger.info('GTFS data downloaded and extracted successfully');
    } catch (error) {
      logger.error('Error downloading GTFS data:', error);
      throw error;
    }
  }

  public async loadData(): Promise<void> {
    try {
      // Check if we have cached data that's still valid
      if (this.data && this.lastFetchTime && Date.now() - this.lastFetchTime < this.CACHE_TTL) {
        logger.info('Using cached GTFS data');
        return;
      }

      // Check if we need to download fresh data
      const tripsFile = path.join(this.GTFS_DIR, 'trips.txt');
      if (!fs.existsSync(tripsFile)) {
        await this.downloadGTFSData();
      }

      // Read and parse the GTFS files
      const trips = this.parseCSVFile('trips.txt', (row: any) => ({
        route_id: row.route_id,
        service_id: row.service_id,
        trip_id: row.trip_id,
        trip_headsign: row.trip_headsign,
        direction_id: parseInt(row.direction_id),
        block_id: row.block_id,
        shape_id: row.shape_id,
      }));

      const stopTimes = this.parseCSVFile('stop_times.txt', (row: any) => ({
        trip_id: row.trip_id,
        arrival_time: row.arrival_time,
        departure_time: row.departure_time,
        stop_id: row.stop_id,
        stop_sequence: parseInt(row.stop_sequence),
        pickup_type: parseInt(row.pickup_type),
        drop_off_type: parseInt(row.drop_off_type),
      }));

      const routes = this.parseCSVFile('routes.txt', (row: any) => ({
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

      const stops = this.parseCSVFile('stops.txt', (row: any) => ({
        stop_id: row.stop_id,
        stop_name: row.stop_name,
        stop_desc: row.stop_desc,
        stop_lat: parseFloat(row.stop_lat),
        stop_lon: parseFloat(row.stop_lon),
        zone_id: row.zone_id,
        stop_url: row.stop_url,
        wheelchair_boarding: parseInt(row.wheelchair_boarding),
      }));

      const calendar = this.parseCSVFile('calendar.txt', (row: any) => ({
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

      // Create stop name map for faster lookups
      const stopNameMap = new Map(stops.map((stop: Stop) => [stop.stop_id, stop.stop_name]));

      // Process stop times to include stop names
      const stopTimesWithNames = stopTimes.map((stopTime: StopTime) => ({
        ...stopTime,
        stopName: stopNameMap.get(stopTime.stop_id) || 'Unknown Stop'
      }));

      // Group stop times by trip_id
      const stopTimesByTrip = stopTimesWithNames.reduce((acc: { [key: string]: StopTimeWithStop[] }, stopTime: StopTimeWithStop) => {
        if (!acc[stopTime.trip_id]) {
          acc[stopTime.trip_id] = [];
        }
        acc[stopTime.trip_id].push(stopTime);
        return acc;
      }, {});

      // Create trips with their stop times
      const tripsWithStops = trips.map((trip: Trip) => ({
        ...trip,
        stopTimes: stopTimesByTrip[trip.trip_id] || []
      }));

      // Sort stop times by sequence
      tripsWithStops.forEach((trip: TripWithStops) => {
        trip.stopTimes.sort((a: StopTimeWithStop, b: StopTimeWithStop) => a.stop_sequence - b.stop_sequence);
      });

      this.data = {
        trips: tripsWithStops,
        routes,
        stops,
        servicePeriods: calendar,
        stopTimes: stopTimesWithNames,
        lastUpdated: new Date().toISOString()
      };

      this.lastFetchTime = Date.now();
      logger.info('Loaded fresh GTFS data');
    } catch (error) {
      logger.error('Error loading GTFS data:', error);
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

  private isServiceActiveOnDate(serviceId: string, date: Date): boolean {
    if (!this.data) return false;
    
    const servicePeriod = this.data.servicePeriods.find(sp => sp.service_id === serviceId);
    if (!servicePeriod) {
      logger.warn(`No service period found for service_id: ${serviceId}`);
      return false;
    }

    // Convert the input date to midnight in UTC
    const localDate = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));
    const dayOfWeek = localDate.getUTCDay();
    
    // Check if the service runs on this day of the week
    const isActive = 
      (dayOfWeek === 0 && servicePeriod.sunday === 1) ||
      (dayOfWeek === 1 && servicePeriod.monday === 1) ||
      (dayOfWeek === 2 && servicePeriod.tuesday === 1) ||
      (dayOfWeek === 3 && servicePeriod.wednesday === 1) ||
      (dayOfWeek === 4 && servicePeriod.thursday === 1) ||
      (dayOfWeek === 5 && servicePeriod.friday === 1) ||
      (dayOfWeek === 6 && servicePeriod.saturday === 1);

    // Convert YYYYMMDD format to Date (in UTC)
    const startDate = new Date(Date.UTC(
      parseInt(servicePeriod.start_date.substring(0, 4)),
      parseInt(servicePeriod.start_date.substring(4, 6)) - 1,
      parseInt(servicePeriod.start_date.substring(6, 8))
    ));
    
    const endDate = new Date(Date.UTC(
      parseInt(servicePeriod.end_date.substring(0, 4)),
      parseInt(servicePeriod.end_date.substring(4, 6)) - 1,
      parseInt(servicePeriod.end_date.substring(6, 8))
    ));

    // For end dates, we want to include the end date in the service period
    // This ensures that a service ending on March 30th runs on March 30th
    const isWithinDateRange = localDate >= startDate && localDate <= endDate;

    // Add more detailed logging for B2 service and MD-N_MN2600_V7_B
    if (serviceId === 'B2') {
      logger.info(`Detailed B2 service check for ${localDate.toISOString()}:`, {
        dayOfWeek,
        isActive,
        isWithinDateRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        localDate: localDate.toISOString(),
        servicePeriod,
        dateComparison: {
          localDate: localDate.getTime(),
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          isAfterStart: localDate >= startDate,
          isBeforeEnd: localDate < endDate
        }
      });
    }

    logger.info(`Service ${serviceId} check for ${localDate.toISOString()}:`, {
      dayOfWeek,
      isActive,
      isWithinDateRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      servicePeriod
    });

    return isActive && isWithinDateRange;
  }

  public async getTripsByRoute(routeId: string, date: Date): Promise<TripWithStops[]> {
    try {
      // Ensure data is loaded
      if (!this.data) {
        await this.loadData();
      }
      if (!this.data) {
        throw new Error('Failed to load GTFS data');
      }

      // Log the input date details
      console.log('Input date details:', {
        originalDate: date.toISOString(),
        originalDateString: date.toString(),
        originalDateUTC: date.toUTCString(),
        originalDateLocal: date.toLocaleString(),
        originalDateTimestamp: date.getTime()
      });

      // Create a new date in UTC to avoid timezone issues
      const localDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      ));
      
      // Log the converted date details
      console.log('Converted date details:', {
        localDateISO: localDate.toISOString(),
        localDateString: localDate.toString(),
        localDateUTC: localDate.toUTCString(),
        localDateLocal: localDate.toLocaleString(),
        localDateTimestamp: localDate.getTime(),
        dayOfWeek: localDate.getUTCDay(),
        timezoneOffset: localDate.getTimezoneOffset()
      });
      
      console.log(`Getting trips for route ${routeId} on ${localDate.toISOString()}`);
      console.log('Available service periods:', JSON.stringify(this.data.servicePeriods, null, 2));

      // First get all active service IDs for this date
      const activeServiceIds = Object.values(this.data.servicePeriods)
        .filter(service => this.isServiceActiveOnDate(service.service_id, localDate))
        .map(service => service.service_id);

      console.log(`Active service IDs for ${localDate.toISOString()}: ${activeServiceIds.join(', ')}`);

      // Get all trips for this route
      const routeTrips = this.data.trips.filter(trip => trip.route_id === routeId);
      console.log(`Found ${routeTrips.length} total trips for route ${routeId}`);

      // Filter trips to only include those with active service IDs
      const activeTrips = routeTrips.filter(trip => {
        const isActive = activeServiceIds.includes(trip.service_id);
        if (trip.trip_id === 'MD-N_MN2600_V7_B') {
          console.log(`Checking trip MD-N_MN2600_V7_B:`, {
            service_id: trip.service_id,
            isActive,
            activeServiceIds,
            date: localDate.toISOString(),
            servicePeriod: this.data.servicePeriods.find(sp => sp.service_id === trip.service_id)
          });
        }
        return isActive;
      });
      console.log(`Found ${activeTrips.length} active trips for route ${routeId}`);

      // Get unique trips based on departure time and direction
      const uniqueTrips = activeTrips.reduce((acc, trip) => {
        const firstStop = this.data.stopTimes.find(st => st.trip_id === trip.trip_id);
        if (!firstStop) return acc;

        const key = `${firstStop.departure_time}-${trip.direction_id}`;
        if (!acc.has(key)) {
          acc.set(key, trip);
        }
        return acc;
      }, new Map<string, Trip>());

      console.log(`Found ${uniqueTrips.size} unique active trips for route ${routeId}`);
      console.log('Unique trip IDs:', Array.from(uniqueTrips.values()).map(t => t.trip_id));

      // Convert trips to TripWithStops format
      const tripsWithStops: TripWithStops[] = Array.from(uniqueTrips.values()).map(trip => {
        const stopTimes = this.data.stopTimes
          .filter(st => st.trip_id === trip.trip_id)
          .map(st => ({
            ...st,
            stopName: this.data.stops.find(s => s.stop_id === st.stop_id)?.stop_name || 'Unknown Stop'
          }))
          .sort((a, b) => a.stop_sequence - b.stop_sequence);

        return {
          ...trip,
          stopTimes
        };
      });

      // Sort trips by departure time
      return tripsWithStops.sort((a, b) => {
        const timeA = a.stopTimes[0]?.departure_time || '';
        const timeB = b.stopTimes[0]?.departure_time || '';
        
        // Convert HH:MM:SS to total minutes for comparison
        const [hoursA, minutesA] = timeA.split(':').map(Number);
        const [hoursB, minutesB] = timeB.split(':').map(Number);
        
        const totalMinutesA = hoursA * 60 + minutesA;
        const totalMinutesB = hoursB * 60 + minutesB;
        
        return totalMinutesA - totalMinutesB;
      });
    } catch (error) {
      console.error('Error getting trips by route:', error);
      throw error;
    }
  }
} 