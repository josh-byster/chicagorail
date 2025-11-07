#!/usr/bin/env tsx
/**
 * GTFS API Validation Script
 *
 * This script validates the Metra GTFS API endpoints:
 * 1. Validates that static endpoints are accessible (published.txt and schedule.zip)
 * 2. Validates that realtime endpoints are accessible (alerts, trip updates, positions)
 * 3. Inspects the actual data structure returned
 * 4. Verifies our data model matches reality
 *
 * Updated for new GTFS ZIP format and Protocol Buffer realtime feeds.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
const envPath = path.join(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

const METRA_API_TOKEN = process.env.METRA_API_TOKEN;
const GTFS_STATIC_SCHEDULE_URL = process.env.GTFS_STATIC_SCHEDULE_URL;
const GTFS_STATIC_PUBLISHED_URL = process.env.GTFS_STATIC_PUBLISHED_URL;
const GTFS_REALTIME_ALERTS_URL = process.env.GTFS_REALTIME_ALERTS_URL;
const GTFS_REALTIME_TRIP_UPDATES_URL =
  process.env.GTFS_REALTIME_TRIP_UPDATES_URL;
const GTFS_REALTIME_POSITIONS_URL = process.env.GTFS_REALTIME_POSITIONS_URL;

if (
  !METRA_API_TOKEN ||
  !GTFS_STATIC_SCHEDULE_URL ||
  !GTFS_STATIC_PUBLISHED_URL ||
  !GTFS_REALTIME_ALERTS_URL ||
  !GTFS_REALTIME_TRIP_UPDATES_URL ||
  !GTFS_REALTIME_POSITIONS_URL
) {
  console.error('❌ Missing required environment variables');
  console.error(
    'Required: METRA_API_TOKEN, GTFS_STATIC_SCHEDULE_URL, GTFS_STATIC_PUBLISHED_URL, GTFS_REALTIME_*_URL'
  );
  process.exit(1);
}

// Helper to create Bearer token header
const getAuthHeader = (): { Authorization: string } => {
  return { Authorization: `Bearer ${METRA_API_TOKEN}` };
};

// Function to test published timestamp endpoint
async function testPublishedTimestamp() {
  const url = GTFS_STATIC_PUBLISHED_URL!;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📡 Testing: Published Timestamp`);
  console.log(`🔗 URL: ${url}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch(url);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch: ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      console.error(`Response body: ${text}`);
      return false;
    }

    const text = await response.text();
    console.log(`\n✅ Success!`);
    console.log(`📅 Published timestamp: ${text.trim()}`);
    console.log(`📦 Length: ${text.length} bytes`);

    return true;
  } catch (error) {
    console.error(`❌ Error fetching endpoint:`, error);
    return false;
  }
}

// Function to test schedule.zip endpoint
async function testScheduleZip() {
  const url = GTFS_STATIC_SCHEDULE_URL!;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📡 Testing: Schedule ZIP`);
  console.log(`🔗 URL: ${url}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch(url);

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch: ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      console.error(`Response body: ${text}`);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`\n✅ Success!`);
    console.log(
      `📦 ZIP file size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `📦 First bytes (hex): ${buffer.slice(0, 4).toString('hex')} (should be 504b0304 for ZIP)`
    );

    // Check if it's a valid ZIP file (starts with PK\x03\x04)
    const isZip =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;
    if (isZip) {
      console.log(`✅ Valid ZIP file detected`);
    } else {
      console.log(`⚠️  Warning: May not be a valid ZIP file`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error fetching endpoint:`, error);
    return false;
  }
}

// Function to test realtime protobuf endpoint
async function testRealtimeProtobuf(name: string, url: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📡 Testing: ${name}`);
  console.log(`🔗 URL: ${url}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch(url, {
      headers: {
        ...getAuthHeader(),
        Accept: 'application/x-protobuf',
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch: ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      console.error(`Response body: ${text}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    console.log(`\n✅ Success!`);
    console.log(`📦 Protocol Buffer parsed successfully`);
    console.log(`📊 Feed header:`);
    console.log(
      `   - GTFS Realtime version: ${feed.header.gtfsRealtimeVersion}`
    );
    console.log(
      `   - Timestamp: ${new Date((feed.header.timestamp as any) * 1000).toISOString()}`
    );
    console.log(
      `   - Incrementality: ${feed.header.incrementality || 'FULL_DATASET'}`
    );
    console.log(`📊 Entities: ${feed.entity.length}`);

    if (feed.entity.length > 0) {
      const firstEntity = feed.entity[0];
      console.log(`\n🔍 First entity structure:`);
      console.log(`   - ID: ${firstEntity.id}`);
      console.log(`   - Has alert: ${!!firstEntity.alert}`);
      console.log(`   - Has tripUpdate: ${!!firstEntity.tripUpdate}`);
      console.log(`   - Has vehicle: ${!!firstEntity.vehicle}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error fetching endpoint:`, error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚆 Metra GTFS API Validation Script');
  console.log('='.repeat(80));
  console.log(`🔐 Using API token: ${METRA_API_TOKEN?.substring(0, 10)}...`);

  const results: Record<string, boolean> = {};

  // Test static endpoints
  console.log('\n\n📋 TESTING STATIC ENDPOINTS');
  console.log('='.repeat(80));

  results['published.txt'] = await testPublishedTimestamp();
  await new Promise((resolve) => setTimeout(resolve, 500));

  results['schedule.zip'] = await testScheduleZip();
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test realtime endpoints
  console.log('\n\n📡 TESTING REALTIME ENDPOINTS (Protocol Buffers)');
  console.log('='.repeat(80));

  results['alerts'] = await testRealtimeProtobuf(
    'Alerts',
    GTFS_REALTIME_ALERTS_URL!
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  results['tripUpdates'] = await testRealtimeProtobuf(
    'Trip Updates',
    GTFS_REALTIME_TRIP_UPDATES_URL!
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  results['positions'] = await testRealtimeProtobuf(
    'Vehicle Positions',
    GTFS_REALTIME_POSITIONS_URL!
  );

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'='.repeat(80)}`);

  console.log('\nStatic Endpoints:');
  console.log(
    `  ${results['published.txt'] ? '✅' : '❌'} published.txt (timestamp)`
  );
  console.log(
    `  ${results['schedule.zip'] ? '✅' : '❌'} schedule.zip (GTFS feed)`
  );

  console.log('\nRealtime Endpoints (Protocol Buffers):');
  console.log(`  ${results['alerts'] ? '✅' : '❌'} alerts`);
  console.log(`  ${results['tripUpdates'] ? '✅' : '❌'} trip updates`);
  console.log(`  ${results['positions'] ? '✅' : '❌'} vehicle positions`);

  const allPassed = Object.values(results).every((r) => r);
  console.log(
    `\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`
  );

  console.log(`\n✨ Validation complete!`);

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
