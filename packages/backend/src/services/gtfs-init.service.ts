import { env } from '../config/env.js';
import { getDatabase } from './database.service.js';
import Database from 'better-sqlite3';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as logger from '../utils/logger.utils.js';
import { DEFAULT_ROUTE_COLORS } from '../constants/gtfs.constants.js';

/**
 * GTFS Static Data Import Service
 *
 * Metra now provides GTFS data via standard ZIP file format
 * We download the schedule.zip, extract it, parse CSV files, and store in SQLite
 */

/**
 * GTFS CSV record types based on GTFS specification
 * Using Record<string, string | number> to represent parsed CSV data
 * where keys are column names and values can be strings or numbers
 */
interface GTFSAgency {
  agency_id: string;
  agency_name: string;
  agency_url?: string;
  agency_timezone?: string;
}

interface GTFSRoute {
  route_id: string;
  route_short_name?: string;
  route_long_name?: string;
  route_type: number;
  route_color?: string;
  route_text_color?: string;
}

interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_desc?: string;
  zone_id?: string;
  parent_station?: string;
  wheelchair_boarding?: number;
}

interface GTFSTrip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
}

interface GTFSStopTime {
  trip_id: string;
  stop_id: string;
  arrival_time: string;
  departure_time: string;
  stop_sequence: number;
  pickup_type?: number;
  drop_off_type?: number;
}

interface GTFSCalendar {
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

interface GTFSCalendarDate {
  service_id: string;
  date: string;
  exception_type: number;
}

interface GTFSData {
  agencies: GTFSAgency[];
  routes: GTFSRoute[];
  stops: GTFSStop[];
  trips: GTFSTrip[];
  stopTimes: GTFSStopTime[];
  calendar: GTFSCalendar[];
  calendarDates: GTFSCalendarDate[];
}

/**
 * Fetch the published timestamp from Metra
 * Returns the timestamp string (e.g., "2025-01-15 03:00:00")
 * Returns null if published URL is not configured
 */
const fetchPublishedTimestamp = async (): Promise<string | null> => {
  if (!env.GTFS_STATIC_PUBLISHED_URL) {
    logger.info('Published timestamp URL not configured, will import data');
    return null;
  }

  try {
    const response = await fetch(env.GTFS_STATIC_PUBLISHED_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch published timestamp: ${response.status} ${response.statusText}`
      );
    }
    const timestamp = (await response.text()).trim();
    logger.info(`Latest published timestamp: ${timestamp}`);
    return timestamp;
  } catch (error) {
    logger.error('Failed to fetch published timestamp', error);
    throw error;
  }
};

/**
 * Get the last imported timestamp from the database
 */
const getLastImportedTimestamp = (): string | null => {
  const db = getDatabase();
  try {
    const result = db
      .prepare('SELECT value FROM metadata WHERE key = ?')
      .get('last_published_timestamp') as { value: string } | undefined;
    return result?.value || null;
  } catch {
    // Table might not exist yet
    return null;
  }
};

/**
 * Save the published timestamp to the database
 */
const saveLastImportedTimestamp = (timestamp: string): void => {
  const db = getDatabase();
  db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)').run(
    'last_published_timestamp',
    timestamp
  );
  logger.info(`Saved published timestamp: ${timestamp}`);
};

/**
 * Download the GTFS schedule ZIP file from Metra
 */
const downloadScheduleZip = async (): Promise<Buffer> => {
  logger.info('Downloading schedule.zip...');
  try {
    const response = await fetch(env.GTFS_STATIC_SCHEDULE_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to download schedule.zip: ${response.status} ${response.statusText}`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    logger.info(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    return buffer;
  } catch (error) {
    logger.error('Failed to download schedule.zip', error);
    throw error;
  }
};

/**
 * Extract ZIP file to a temporary directory
 */
const extractZipToTemp = (zipBuffer: Buffer): string => {
  logger.info('Extracting ZIP file...');
  try {
    const zip = new AdmZip(zipBuffer);
    const tempDir = path.join(os.tmpdir(), `gtfs-${Date.now()}`);
    zip.extractAllTo(tempDir, true);
    logger.debug(`Extracted to ${tempDir}`);
    return tempDir;
  } catch (error) {
    logger.error('Failed to extract ZIP', error);
    throw error;
  }
};

/**
 * Parse a GTFS CSV file
 */
const parseGTFSFile = <T>(filePath: string): T[] => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Convert empty strings to null
        if (value === '') return null;
        // Convert numeric strings to numbers for specific columns
        if (
          context.column === 'stop_lat' ||
          context.column === 'stop_lon' ||
          context.column === 'route_type' ||
          context.column === 'direction_id' ||
          context.column === 'stop_sequence' ||
          context.column === 'wheelchair_boarding' ||
          context.column === 'exception_type' ||
          context.column === 'monday' ||
          context.column === 'tuesday' ||
          context.column === 'wednesday' ||
          context.column === 'thursday' ||
          context.column === 'friday' ||
          context.column === 'saturday' ||
          context.column === 'sunday'
        ) {
          return value ? parseFloat(value) : null;
        }
        return value;
      },
    });
    return records as T[];
  } catch (error) {
    logger.error(`Failed to parse ${filePath}`, error);
    throw error;
  }
};

/**
 * Parse all GTFS files from the extracted directory
 */
const parseGTFSFiles = (tempDir: string): GTFSData => {
  logger.info('Parsing GTFS files...');

  const agencies = parseGTFSFile<GTFSAgency>(path.join(tempDir, 'agency.txt'));
  logger.debug(`Parsed ${agencies.length} agencies`);

  const routes = parseGTFSFile<GTFSRoute>(path.join(tempDir, 'routes.txt'));
  logger.debug(`Parsed ${routes.length} routes`);

  const stops = parseGTFSFile<GTFSStop>(path.join(tempDir, 'stops.txt'));
  logger.debug(`Parsed ${stops.length} stops`);

  const trips = parseGTFSFile<GTFSTrip>(path.join(tempDir, 'trips.txt'));
  logger.debug(`Parsed ${trips.length} trips`);

  const stopTimes = parseGTFSFile<GTFSStopTime>(
    path.join(tempDir, 'stop_times.txt')
  );
  logger.debug(`Parsed ${stopTimes.length} stop times`);

  const calendar = parseGTFSFile<GTFSCalendar>(
    path.join(tempDir, 'calendar.txt')
  );
  logger.debug(`Parsed ${calendar.length} calendar entries`);

  const calendarDates = parseGTFSFile<GTFSCalendarDate>(
    path.join(tempDir, 'calendar_dates.txt')
  );
  logger.debug(`Parsed ${calendarDates.length} calendar date exceptions`);

  return {
    agencies,
    routes,
    stops,
    trips,
    stopTimes,
    calendar,
    calendarDates,
  };
};

/**
 * Clean up temporary directory
 */
const cleanupTempDir = (tempDir: string): void => {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    logger.debug('Cleaned up temp directory');
  } catch (error) {
    logger.warn(`Failed to cleanup temp directory: ${error}`);
  }
};

/**
 * Import GTFS static data from Metra's ZIP file
 * Checks published timestamp before downloading to avoid unnecessary work
 */
export const importGTFSStaticData = async (): Promise<void> => {
  logger.info('Importing GTFS static data from Metra...');

  let tempDir: string | null = null;

  try {
    // Step 1: Check published timestamp (if URL is configured)
    const publishedTimestamp = await fetchPublishedTimestamp();

    // Only check for updates if we have a published timestamp
    if (publishedTimestamp) {
      const lastImportedTimestamp = getLastImportedTimestamp();

      if (publishedTimestamp === lastImportedTimestamp) {
        logger.info('GTFS data is up to date, skipping import');
        return;
      }

      logger.info(`New data available (published: ${publishedTimestamp})`);
      if (lastImportedTimestamp) {
        logger.info(`Last imported: ${lastImportedTimestamp}`);
      }
    } else {
      logger.info('Published timestamp not available, will import/update data');
    }

    // Step 2: Download schedule.zip
    const zipBuffer = await downloadScheduleZip();

    // Step 3: Extract ZIP
    tempDir = extractZipToTemp(zipBuffer);

    // Step 4: Parse GTFS files
    const gtfsData = parseGTFSFiles(tempDir);

    // Step 5: Insert into database
    logger.info('Inserting data into database...');
    const db = getDatabase();
    createTables(db);
    insertAgencies(db, gtfsData.agencies);
    insertRoutes(db, gtfsData.routes);
    insertStops(db, gtfsData.stops);
    insertTrips(db, gtfsData.trips);
    insertStopTimes(db, gtfsData.stopTimes);
    insertCalendar(db, gtfsData.calendar);
    insertCalendarDates(db, gtfsData.calendarDates);
    createIndexes(db);
    deriveLinesServed(db);

    // Step 6: Save published timestamp (if we have one)
    if (publishedTimestamp) {
      saveLastImportedTimestamp(publishedTimestamp);
    }

    logger.info('GTFS static data import complete!');
  } catch (error) {
    logger.error('GTFS import failed', error);
    throw error;
  } finally {
    // Step 7: Cleanup
    if (tempDir) {
      cleanupTempDir(tempDir);
    }
  }
};

const createTables = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agency (
      agency_id TEXT PRIMARY KEY,
      agency_name TEXT NOT NULL,
      agency_url TEXT,
      agency_timezone TEXT
    );

    CREATE TABLE IF NOT EXISTS routes (
      route_id TEXT PRIMARY KEY,
      route_short_name TEXT,
      route_long_name TEXT,
      route_type INTEGER,
      route_color TEXT,
      route_text_color TEXT
    );

    CREATE TABLE IF NOT EXISTS stops (
      stop_id TEXT PRIMARY KEY,
      stop_name TEXT NOT NULL,
      stop_lat REAL NOT NULL,
      stop_lon REAL NOT NULL,
      wheelchair_boarding INTEGER,
      zone_id TEXT
    );

    CREATE TABLE IF NOT EXISTS trips (
      trip_id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      service_id TEXT,
      trip_headsign TEXT,
      direction_id INTEGER,
      FOREIGN KEY (route_id) REFERENCES routes(route_id)
    );

    CREATE TABLE IF NOT EXISTS stop_times (
      trip_id TEXT NOT NULL,
      stop_id TEXT NOT NULL,
      stop_sequence INTEGER NOT NULL,
      arrival_time TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      PRIMARY KEY (trip_id, stop_sequence),
      FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
      FOREIGN KEY (stop_id) REFERENCES stops(stop_id)
    );

    CREATE TABLE IF NOT EXISTS calendar (
      service_id TEXT PRIMARY KEY,
      monday INTEGER,
      tuesday INTEGER,
      wednesday INTEGER,
      thursday INTEGER,
      friday INTEGER,
      saturday INTEGER,
      sunday INTEGER,
      start_date TEXT,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar_dates (
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      exception_type INTEGER NOT NULL,
      PRIMARY KEY (service_id, date)
    );
  `);
};

const insertAgencies = (
  db: Database.Database,
  agencies: GTFSAgency[]
): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO agency (agency_id, agency_name, agency_url, agency_timezone)
    VALUES (?, ?, ?, ?)
  `);
  for (const agency of agencies) {
    stmt.run(
      agency.agency_id,
      agency.agency_name,
      agency.agency_url,
      agency.agency_timezone
    );
  }
};

const insertRoutes = (db: Database.Database, routes: GTFSRoute[]): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO routes (route_id, route_short_name, route_long_name, route_type, route_color, route_text_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const route of routes) {
    // TRANSFORMATION (Option B): Add # prefix to colors and convert text color number to hex
    let routeColor = DEFAULT_ROUTE_COLORS.BACKGROUND;
    if (route.route_color) {
      const colorStr = String(route.route_color);
      routeColor = colorStr.startsWith('#') ? colorStr : `#${colorStr}`;
    }

    // Convert route_text_color number to hex color
    let textColor = DEFAULT_ROUTE_COLORS.TEXT_ON_LIGHT;
    if (
      route.route_text_color !== undefined &&
      route.route_text_color !== null
    ) {
      if (typeof route.route_text_color === 'number') {
        textColor =
          route.route_text_color === 0
            ? DEFAULT_ROUTE_COLORS.TEXT_ON_DARK
            : DEFAULT_ROUTE_COLORS.TEXT_ON_LIGHT;
      } else {
        const colorStr = String(route.route_text_color);
        textColor = colorStr.startsWith('#') ? colorStr : `#${colorStr}`;
      }
    }

    stmt.run(
      route.route_id,
      route.route_short_name,
      route.route_long_name,
      route.route_type,
      routeColor,
      textColor
    );
  }
};

const insertStops = (db: Database.Database, stops: GTFSStop[]): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stops (stop_id, stop_name, stop_lat, stop_lon, wheelchair_boarding, zone_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const stop of stops) {
    // TRANSFORMATION (Option B): Convert wheelchair_boarding to boolean (1 = true, 0/2 = false)
    const wheelchairAccessible = stop.wheelchair_boarding === 1;

    stmt.run(
      stop.stop_id,
      stop.stop_name,
      stop.stop_lat,
      stop.stop_lon,
      wheelchairAccessible ? 1 : 0, // Store as integer for SQLite compatibility
      stop.zone_id
    );
  }
};

const insertTrips = (db: Database.Database, trips: GTFSTrip[]): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO trips (trip_id, route_id, service_id, trip_headsign, direction_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const trip of trips) {
    stmt.run(
      trip.trip_id,
      trip.route_id,
      trip.service_id,
      trip.trip_headsign,
      trip.direction_id
    );
  }
};

const insertStopTimes = (
  db: Database.Database,
  stopTimes: GTFSStopTime[]
): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stop_times (trip_id, stop_id, stop_sequence, arrival_time, departure_time)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const stopTime of stopTimes) {
    stmt.run(
      stopTime.trip_id,
      stopTime.stop_id,
      stopTime.stop_sequence,
      stopTime.arrival_time,
      stopTime.departure_time
    );
  }
};

const insertCalendar = (
  db: Database.Database,
  calendar: GTFSCalendar[]
): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO calendar (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const cal of calendar) {
    stmt.run(
      cal.service_id,
      cal.monday,
      cal.tuesday,
      cal.wednesday,
      cal.thursday,
      cal.friday,
      cal.saturday,
      cal.sunday,
      cal.start_date,
      cal.end_date
    );
  }
};

const insertCalendarDates = (
  db: Database.Database,
  calendarDates: GTFSCalendarDate[]
): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO calendar_dates (service_id, date, exception_type)
    VALUES (?, ?, ?)
  `);
  for (const calDate of calendarDates) {
    stmt.run(calDate.service_id, calDate.date, calDate.exception_type);
  }
};

const createIndexes = (db: Database.Database): void => {
  logger.info('Creating performance indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stops_name ON stops(stop_name);
    CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
    CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times(trip_id);
    CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id);
    CREATE INDEX IF NOT EXISTS idx_stop_times_arrival ON stop_times(arrival_time);
    CREATE INDEX IF NOT EXISTS idx_calendar_dates_service ON calendar_dates(service_id);
    CREATE INDEX IF NOT EXISTS idx_calendar_dates_date ON calendar_dates(date);
  `);
};

/**
 * TRANSFORMATION (Option B): Derive lines_served for each station
 * Analyzes which routes stop at each station by joining trips and stop_times
 */
const deriveLinesServed = (db: Database.Database): void => {
  // Add lines_served column if it doesn't exist
  try {
    db.exec(`ALTER TABLE stops ADD COLUMN lines_served TEXT`);
  } catch (error) {
    // Check if error is due to column already existing
    if (error instanceof Error && error.message.includes('duplicate column')) {
      logger.debug('Column lines_served already exists, skipping creation');
    } else {
      // Re-throw unexpected errors
      logger.error('Failed to add lines_served column', error);
      throw error;
    }
  }

  // Find all routes that serve each station
  const stations = db.prepare('SELECT stop_id FROM stops').all() as {
    stop_id: string;
  }[];

  const updateStmt = db.prepare(`
    UPDATE stops SET lines_served = ? WHERE stop_id = ?
  `);

  for (const station of stations) {
    // Query to find all unique routes that have trips stopping at this station
    const lines = db
      .prepare(
        `
      SELECT DISTINCT t.route_id
      FROM trips t
      JOIN stop_times st ON t.trip_id = st.trip_id
      WHERE st.stop_id = ?
      ORDER BY t.route_id
    `
      )
      .all(station.stop_id) as { route_id: string }[];

    // Store as JSON array for easy querying
    updateStmt.run(
      JSON.stringify(lines.map((row) => row.route_id)),
      station.stop_id
    );
  }

  logger.info(`Derived lines_served for ${stations.length} stations`);
};
