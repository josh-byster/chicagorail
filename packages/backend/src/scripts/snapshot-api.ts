#!/usr/bin/env tsx
/**
 * API Snapshot Script
 *
 * Queries all Metra GTFS API endpoints and saves the responses
 * to a samples directory for regression testing.
 */

// IMPORTANT: Load dotenv FIRST, before any other imports that use env variables
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root (4 levels up from this file)
const envPath = path.join(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

console.log(`Loading .env from: ${envPath}`);

// Now import modules that depend on env variables
import { env } from '../config/env.js';
import { mkdir, writeFile } from 'fs/promises';

interface GTFSConfig {
  username: string;
  password: string;
  baseUrl: string;
  alertsUrl: string;
  tripUpdatesUrl: string;
  positionsUrl: string;
}

const getConfig = (): GTFSConfig => ({
  username: env.METRA_API_USERNAME,
  password: env.METRA_API_PASSWORD,
  baseUrl: env.GTFS_STATIC_BASE_URL,
  alertsUrl: env.GTFS_REALTIME_ALERTS_URL,
  tripUpdatesUrl: env.GTFS_REALTIME_TRIP_UPDATES_URL,
  positionsUrl: env.GTFS_REALTIME_POSITIONS_URL,
});

const getAuthHeader = (): { Authorization: string } => {
  const config = getConfig();
  const auth = Buffer.from(`${config.username}:${config.password}`).toString(
    'base64'
  );
  return { Authorization: `Basic ${auth}` };
};

const fetchAndSave = async (
  url: string,
  filename: string,
  samplesDir: string
): Promise<void> => {
  console.log(`  ⏳ Fetching ${filename}...`);

  try {
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const filepath = path.join(samplesDir, filename);

    await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`  ✅ Saved ${filename}`);
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${filename}:`, error);
    throw error;
  }
};

const main = async (): Promise<void> => {
  console.log('📸 Creating API snapshots for regression testing...\n');

  const config = getConfig();
  const samplesDir = path.join(process.cwd(), 'samples');

  // Create samples directory if it doesn't exist
  console.log(`📁 Creating samples directory at ${samplesDir}...`);
  await mkdir(samplesDir, { recursive: true });

  try {
    // GTFS Static Schedule Endpoints
    console.log('\n📋 Fetching GTFS Static Schedule data...');

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/agency`,
      'gtfs_schedule_agency.json',
      samplesDir
    );

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/routes`,
      'gtfs_schedule_routes.json',
      samplesDir
    );

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/stops`,
      'gtfs_schedule_stops.json',
      samplesDir
    );

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/trips`,
      'gtfs_schedule_trips.json',
      samplesDir
    );

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/stop_times`,
      'gtfs_schedule_stop_times.json',
      samplesDir
    );

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/calendar`,
      'gtfs_schedule_calendar.json',
      samplesDir
    );

    await fetchAndSave(
      `${config.baseUrl}/gtfs/schedule/calendar_dates`,
      'gtfs_schedule_calendar_dates.json',
      samplesDir
    );

    // GTFS Realtime Endpoints
    console.log('\n📡 Fetching GTFS Realtime data...');

    await fetchAndSave(
      config.alertsUrl,
      'gtfs_realtime_alerts.json',
      samplesDir
    );

    await fetchAndSave(
      config.tripUpdatesUrl,
      'gtfs_realtime_trip_updates.json',
      samplesDir
    );

    await fetchAndSave(
      config.positionsUrl,
      'gtfs_realtime_positions.json',
      samplesDir
    );

    console.log('\n✅ All snapshots saved successfully!');
    console.log(`📂 Snapshots location: ${samplesDir}`);

    // Print summary
    console.log('\n📊 Snapshot Summary:');
    console.log('  Static Schedule:');
    console.log('    - agency');
    console.log('    - routes');
    console.log('    - stops');
    console.log('    - trips');
    console.log('    - stop_times');
    console.log('    - calendar');
    console.log('    - calendar_dates');
    console.log('  Realtime:');
    console.log('    - alerts');
    console.log('    - trip_updates');
    console.log('    - positions');
  } catch (error) {
    console.error('\n❌ Snapshot creation failed:', error);
    process.exit(1);
  }
};

// Run the script
main().catch(console.error);
