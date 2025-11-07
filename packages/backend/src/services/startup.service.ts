import cron from 'node-cron';
import { initDatabase } from './database.service.js';
import { importGTFSStaticData } from './gtfs-init.service.js';
import { startGTFSRealtimePolling } from './gtfs-realtime.service.js';

/**
 * Initialize database and GTFS data on startup
 */
export async function initializeOnStartup(): Promise<void> {
  console.log('🚀 Starting application initialization...');

  try {
    // 1. Initialize database
    console.log('📦 Initializing database...');
    const db = initDatabase();

    let needsImport = false;
    try {
      const routeCount = db
        .prepare('SELECT COUNT(*) as count FROM routes')
        .get() as { count: number } | undefined;

      if (!routeCount || routeCount.count === 0) {
        needsImport = true;
      } else {
        console.log(
          `✅ Database already has data (${routeCount.count} routes)`
        );
      }
    } catch (error) {
      // Table doesn't exist, need to import
      console.log(
        '📥 Database tables not found, creating and importing data...'
      );
      needsImport = true;
    }

    if (needsImport) {
      console.log('📥 Importing GTFS data...');
      await importGTFSStaticData();
    }

    // 3. Start realtime polling
    console.log('📡 Starting GTFS realtime polling...');
    startGTFSRealtimePolling();

    // 4. Schedule hourly GTFS data refresh
    console.log('⏰ Scheduling hourly GTFS data refresh...');
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Starting scheduled GTFS data refresh...');
      try {
        await importGTFSStaticData();
        console.log('✅ Scheduled GTFS data refresh completed');
      } catch (error) {
        console.error('❌ Scheduled GTFS data refresh failed:', error);
      }
    });

    console.log('✅ Application initialization complete!');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    throw error;
  }
}
