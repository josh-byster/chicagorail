#!/usr/bin/env tsx
/**
 * API Snapshot Script
 *
 * Downloads Metra GTFS static and realtime data and saves them
 * to a samples directory for regression testing.
 *
 * Updated to work with new GTFS ZIP format and Protocol Buffer realtime feeds.
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
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

interface GTFSConfig {
  apiToken: string;
  scheduleUrl: string;
  publishedUrl: string;
  alertsUrl: string;
  tripUpdatesUrl: string;
  positionsUrl: string;
}

const getConfig = (): GTFSConfig => ({
  apiToken: env.METRA_API_TOKEN,
  scheduleUrl: env.GTFS_STATIC_SCHEDULE_URL,
  publishedUrl: env.GTFS_STATIC_PUBLISHED_URL,
  alertsUrl: env.GTFS_REALTIME_ALERTS_URL,
  tripUpdatesUrl: env.GTFS_REALTIME_TRIP_UPDATES_URL,
  positionsUrl: env.GTFS_REALTIME_POSITIONS_URL,
});

const getAuthHeader = (): { Authorization: string } => {
  return { Authorization: `Bearer ${getConfig().apiToken}` };
};

const fetchAndSaveText = async (
  url: string,
  filename: string,
  samplesDir: string
): Promise<void> => {
  console.log(`  ⏳ Fetching ${filename}...`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    const filepath = path.join(samplesDir, filename);

    await writeFile(filepath, text, 'utf-8');
    console.log(`  ✅ Saved ${filename} (${text.length} bytes)`);
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${filename}:`, error);
    throw error;
  }
};

const fetchAndSaveBinary = async (
  url: string,
  filename: string,
  samplesDir: string
): Promise<void> => {
  console.log(`  ⏳ Fetching ${filename}...`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filepath = path.join(samplesDir, filename);

    await writeFile(filepath, buffer);
    console.log(
      `  ✅ Saved ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`
    );
  } catch (error) {
    console.error(`  ❌ Failed to fetch ${filename}:`, error);
    throw error;
  }
};

const fetchAndSaveProtobuf = async (
  url: string,
  filename: string,
  samplesDir: string
): Promise<void> => {
  console.log(`  ⏳ Fetching ${filename}...`);

  try {
    const response = await fetch(url, {
      headers: {
        ...getAuthHeader(),
        Accept: 'application/x-protobuf',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    // Parse protobuf and save as JSON for readability
    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    // Convert to plain object for JSON serialization
    const plainObject =
      GtfsRealtimeBindings.transit_realtime.FeedMessage.toObject(feed, {
        longs: String,
        enums: String,
        bytes: String,
      });

    const filepath = path.join(samplesDir, filename);
    await writeFile(filepath, JSON.stringify(plainObject, null, 2), 'utf-8');
    console.log(`  ✅ Saved ${filename} (${feed.entity.length} entities)`);
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
    // GTFS Static Data
    console.log('\n📋 Fetching GTFS Static data...');

    await fetchAndSaveText(
      config.publishedUrl,
      'gtfs_published.txt',
      samplesDir
    );

    await fetchAndSaveBinary(
      config.scheduleUrl,
      'gtfs_schedule.zip',
      samplesDir
    );

    // GTFS Realtime Endpoints (Protocol Buffer format)
    console.log('\n📡 Fetching GTFS Realtime data (Protocol Buffers)...');

    await fetchAndSaveProtobuf(
      config.alertsUrl,
      'gtfs_realtime_alerts.json',
      samplesDir
    );

    await fetchAndSaveProtobuf(
      config.tripUpdatesUrl,
      'gtfs_realtime_trip_updates.json',
      samplesDir
    );

    await fetchAndSaveProtobuf(
      config.positionsUrl,
      'gtfs_realtime_positions.json',
      samplesDir
    );

    console.log('\n✅ All snapshots saved successfully!');
    console.log(`📂 Snapshots location: ${samplesDir}`);

    // Print summary
    console.log('\n📊 Snapshot Summary:');
    console.log('  Static Data:');
    console.log('    - published.txt (timestamp)');
    console.log('    - schedule.zip (GTFS feed)');
    console.log('  Realtime (Protocol Buffers converted to JSON):');
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
