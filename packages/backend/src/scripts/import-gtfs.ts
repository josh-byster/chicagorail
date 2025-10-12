#!/usr/bin/env tsx
/**
 * GTFS Import Script
 *
 * Imports GTFS static data from Metra API into SQLite database
 * with Option B transformations (clean data model)
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
import { initDatabase } from '../services/database.service';
import { importGTFSStaticData } from '../services/gtfs-init.service';

async function main() {
  console.log('🚆 Metra GTFS Import Script');
  console.log('=' .repeat(80));

  try {
    // Initialize database
    console.log('📦 Initializing database...');
    initDatabase();

    // Import GTFS static data
    console.log('\n📥 Starting GTFS import...');
    await importGTFSStaticData();

    console.log('\n✨ Import complete!');
    console.log('🔍 You can now query the database at:', process.env.DATABASE_PATH);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
