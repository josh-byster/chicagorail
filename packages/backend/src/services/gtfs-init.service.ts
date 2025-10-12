import { env } from '../config/env.js';
import { getDatabase } from './database.service.js';

/**
 * GTFS Static Data Import Service
 *
 * Metra provides GTFS data via JSON endpoints (not traditional zip files)
 * per research.md. We fetch from these endpoints and store in SQLite.
 */

interface GTFSConfig {
  username: string;
  password: string;
  baseUrl: string;
}

// Lazy config getter - only access env when needed
const getConfig = (): GTFSConfig => ({
  username: env.METRA_API_USERNAME,
  password: env.METRA_API_PASSWORD,
  baseUrl: env.GTFS_STATIC_BASE_URL,
});

// Helper to create Basic Auth header
const getAuthHeader = (): { Authorization: string } => {
  const config = getConfig();
  const auth = Buffer.from(`${config.username}:${config.password}`).toString(
    'base64'
  );
  return { Authorization: `Basic ${auth}` };
};

// Fetch GTFS data from Metra JSON endpoints
const fetchGTFSEndpoint = async (endpoint: string): Promise<any> => {
  const config = getConfig();
  const url = `${config.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

/**
 * Import GTFS static data from Metra's JSON endpoints
 * Should be run weekly or on deployment (per research.md)
 */
export const importGTFSStaticData = async (): Promise<void> => {
  console.log('📥 Importing GTFS static data from Metra API...');

  try {
    const db = getDatabase();

    // Create tables if they don't exist
    createTables(db);

    // Fetch data from Metra JSON endpoints
    console.log('  ⏳ Fetching agencies...');
    const agencies = await fetchGTFSEndpoint('/gtfs/schedule/agency');

    console.log('  ⏳ Fetching routes...');
    const routes = await fetchGTFSEndpoint('/gtfs/schedule/routes');

    console.log('  ⏳ Fetching stops...');
    const stops = await fetchGTFSEndpoint('/gtfs/schedule/stops');

    console.log('  ⏳ Fetching trips...');
    const trips = await fetchGTFSEndpoint('/gtfs/schedule/trips');

    console.log('  ⏳ Fetching stop times...');
    const stopTimes = await fetchGTFSEndpoint('/gtfs/schedule/stop_times');

    console.log('  ⏳ Fetching calendar...');
    const calendar = await fetchGTFSEndpoint('/gtfs/schedule/calendar');

    console.log('  ⏳ Fetching calendar_dates...');
    const calendarDates = await fetchGTFSEndpoint(
      '/gtfs/schedule/calendar_dates'
    );

    // Insert data into database
    console.log('  💾 Inserting data into database...');
    insertAgencies(db, agencies);
    insertRoutes(db, routes);
    insertStops(db, stops);
    insertTrips(db, trips);
    insertStopTimes(db, stopTimes);
    insertCalendar(db, calendar);
    insertCalendarDates(db, calendarDates);

    // Create indexes for performance (per research.md)
    createIndexes(db);

    // TRANSFORMATION (Option B): Derive lines_served for each station
    console.log('  🔄 Deriving lines_served for stations...');
    deriveLinesServed(db);

    console.log('✅ GTFS static data import complete!');
  } catch (error) {
    console.error('❌ GTFS import failed:', error);
    throw error;
  }
};

const createTables = (db: any) => {
  db.exec(`
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

const insertAgencies = (db: any, agencies: any[]) => {
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

const insertRoutes = (db: any, routes: any[]) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO routes (route_id, route_short_name, route_long_name, route_type, route_color, route_text_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const route of routes) {
    // TRANSFORMATION (Option B): Add # prefix to colors and convert text color number to hex
    let routeColor = '#CCCCCC'; // Default gray
    if (route.route_color) {
      const colorStr = String(route.route_color);
      routeColor = colorStr.startsWith('#') ? colorStr : `#${colorStr}`;
    }

    // Convert route_text_color number to hex color
    let textColor = '#000000'; // Default black
    if (
      route.route_text_color !== undefined &&
      route.route_text_color !== null
    ) {
      if (typeof route.route_text_color === 'number') {
        textColor = route.route_text_color === 0 ? '#FFFFFF' : '#000000';
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

const insertStops = (db: any, stops: any[]) => {
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

const insertTrips = (db: any, trips: any[]) => {
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

const insertStopTimes = (db: any, stopTimes: any[]) => {
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

const insertCalendar = (db: any, calendar: any[]) => {
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

const insertCalendarDates = (db: any, calendarDates: any[]) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO calendar_dates (service_id, date, exception_type)
    VALUES (?, ?, ?)
  `);
  for (const calDate of calendarDates) {
    stmt.run(calDate.service_id, calDate.date, calDate.exception_type);
  }
};

const createIndexes = (db: any) => {
  console.log('  🔍 Creating performance indexes...');
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
const deriveLinesServed = (db: any) => {
  // Add lines_served column if it doesn't exist
  try {
    db.exec(`ALTER TABLE stops ADD COLUMN lines_served TEXT`);
  } catch (error) {
    // Column might already exist, ignore error
  }

  // Find all routes that serve each station
  const stations = db.prepare('SELECT stop_id FROM stops').all();

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
      .all(station.stop_id)
      .map((row: any) => row.route_id);

    // Store as JSON array for easy querying
    updateStmt.run(JSON.stringify(lines), station.stop_id);
  }

  console.log(`  ✅ Derived lines_served for ${stations.length} stations`);
};
