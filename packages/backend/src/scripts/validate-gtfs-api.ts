#!/usr/bin/env tsx
/**
 * GTFS API Validation Script
 *
 * This script queries the Metra GTFS API endpoints to:
 * 1. Validate that endpoints are accessible
 * 2. Inspect the actual JSON structure returned
 * 3. Save sample responses for reference
 * 4. Verify our data model matches reality
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
const envPath = path.join(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

const METRA_API_USERNAME = process.env.METRA_API_USERNAME;
const METRA_API_PASSWORD = process.env.METRA_API_PASSWORD;
const GTFS_STATIC_BASE_URL = process.env.GTFS_STATIC_BASE_URL;

if (!METRA_API_USERNAME || !METRA_API_PASSWORD || !GTFS_STATIC_BASE_URL) {
  console.error('❌ Missing required environment variables');
  console.error('Required: METRA_API_USERNAME, METRA_API_PASSWORD, GTFS_STATIC_BASE_URL');
  process.exit(1);
}

// Helper to create Basic Auth header
const getAuthHeader = (): { Authorization: string } => {
  const auth = Buffer.from(`${METRA_API_USERNAME}:${METRA_API_PASSWORD}`).toString('base64');
  return { Authorization: `Basic ${auth}` };
};

// Endpoints to test
const endpoints = [
  '/gtfs/schedule/agency',
  '/gtfs/schedule/routes',
  '/gtfs/schedule/stops',
  '/gtfs/schedule/trips',
  '/gtfs/schedule/stop_times',
  '/gtfs/schedule/calendar',
];

// Function to fetch and analyze endpoint
async function fetchAndAnalyze(endpoint: string) {
  const url = `${GTFS_STATIC_BASE_URL}${endpoint}`;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📡 Testing: ${endpoint}`);
  console.log(`🔗 URL: ${url}`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch(url, {
      headers: getAuthHeader(),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(`❌ Failed to fetch: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Response body: ${text}`);
      return null;
    }

    const data = await response.json();

    // Analyze structure
    console.log(`\n✅ Success!`);
    console.log(`📦 Data type: ${typeof data}`);
    console.log(`📦 Is Array: ${Array.isArray(data)}`);

    if (Array.isArray(data)) {
      console.log(`📊 Array length: ${data.length}`);
      if (data.length > 0) {
        console.log(`\n🔍 First item structure:`);
        console.log(JSON.stringify(data[0], null, 2));

        console.log(`\n🔑 Keys in first item:`);
        console.log(Object.keys(data[0]).join(', '));
      }
    } else {
      console.log(`\n🔍 Data structure:`);
      console.log(JSON.stringify(data, null, 2).substring(0, 500));
    }

    // Save sample to file
    const samplesDir = path.join(process.cwd(), 'samples');
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    const filename = endpoint.replace(/\//g, '_') + '.json';
    const filepath = path.join(samplesDir, filename);

    // Save first 5 items if array, or entire object
    const sampleData = Array.isArray(data) ? data.slice(0, 5) : data;
    fs.writeFileSync(filepath, JSON.stringify(sampleData, null, 2));
    console.log(`\n💾 Sample saved to: ${filepath}`);

    return data;

  } catch (error) {
    console.error(`❌ Error fetching endpoint:`, error);
    return null;
  }
}

// Main execution
async function main() {
  console.log('🚆 Metra GTFS API Validation Script');
  console.log('=' .repeat(80));
  console.log(`🔐 Using credentials: ${METRA_API_USERNAME}`);
  console.log(`🌐 Base URL: ${GTFS_STATIC_BASE_URL}`);

  const results: Record<string, any> = {};

  for (const endpoint of endpoints) {
    const data = await fetchAndAnalyze(endpoint);
    results[endpoint] = data;

    // Wait a bit between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 SUMMARY`);
  console.log(`${'='.repeat(80)}`);

  for (const [endpoint, data] of Object.entries(results)) {
    const status = data ? '✅' : '❌';
    const count = data && Array.isArray(data) ? `(${data.length} items)` : '';
    console.log(`${status} ${endpoint} ${count}`);
  }

  console.log(`\n💡 Sample files saved to: packages/backend/samples/`);
  console.log(`\n✨ Validation complete!`);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
