import cron from 'node-cron';
import { initDatabase } from './database.service.js';
import { importGTFSStaticData } from './gtfs-init.service.js';
import { startGTFSRealtimePolling } from './gtfs-realtime.service.js';
import * as logger from '../utils/logger.utils.js';

/**
 * Initialize database and GTFS data on startup
 */
export async function initializeOnStartup(): Promise<void> {
  logger.info('Starting application initialization...');

  try {
    // 1. Initialize database
    logger.info('Initializing database...');
    const db = initDatabase();

    let needsImport = false;
    try {
      const routeCount = db
        .prepare('SELECT COUNT(*) as count FROM routes')
        .get() as { count: number } | undefined;

      if (!routeCount || routeCount.count === 0) {
        needsImport = true;
      } else {
        logger.info(`Database already has data (${routeCount.count} routes)`);
      }
    } catch (error) {
      // Table doesn't exist, need to import
      logger.info('Database tables not found, creating and importing data...');
      needsImport = true;
    }

    if (needsImport) {
      logger.info('Importing GTFS data...');
      await importGTFSStaticData();
    }

    // 3. Start realtime polling
    logger.info('Starting GTFS realtime polling...');
    startGTFSRealtimePolling();

    // 4. Schedule hourly GTFS data refresh
    logger.info('Scheduling hourly GTFS data refresh...');
    cron.schedule('0 * * * *', async () => {
      logger.info('Starting scheduled GTFS data refresh...');
      try {
        await importGTFSStaticData();
        logger.info('Scheduled GTFS data refresh completed');
      } catch (error) {
        logger.error('Scheduled GTFS data refresh failed', error);
      }
    });

    logger.info('Application initialization complete!');
  } catch (error) {
    logger.error('Application initialization failed', error);
    throw error;
  }
}
