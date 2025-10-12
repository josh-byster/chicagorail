import { Router } from 'express';
import { getDatabase } from '../services/database.service.js';

const router: Router = Router();

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  gtfs_last_updated: string | null;
  gtfs_static_version: string | null;
  environment: string;
}

/**
 * GET /health
 *
 * Returns health status of the API
 *
 * Response:
 * - 200: Health status object
 * - 500: Internal server error
 */
router.get('/health', (_req, res) => {
  try {
    const db = getDatabase();

    // Get GTFS last updated timestamp from database
    let gtfsLastUpdated: string | null = null;
    let gtfsStaticVersion: string | null = null;

    try {
      const info = db.prepare('PRAGMA user_version').get() as {
        user_version: number;
      };
      gtfsStaticVersion = info?.user_version?.toString() || null;

      // Get the last modified time from the trips table (or any table that gets updated during import)
      const lastUpdatedResult = db
        .prepare(
          `
        SELECT MAX(last_modified) as last_updated 
        FROM (
          SELECT MAX(last_modified) as last_modified FROM trips
          UNION ALL
          SELECT MAX(last_modified) as last_modified FROM stops
          UNION ALL
          SELECT MAX(last_modified) as last_modified FROM routes
        )
      `
        )
        .get() as { last_updated: string | null } | undefined;

      gtfsLastUpdated = lastUpdatedResult?.last_updated || null;
    } catch (dbError) {
      console.warn('Could not fetch GTFS metadata:', dbError);
    }

    const healthResponse: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      gtfs_last_updated: gtfsLastUpdated,
      gtfs_static_version: gtfsStaticVersion,
      environment: process.env.NODE_ENV || 'development',
    };

    res.json(healthResponse);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      gtfs_last_updated: null,
      gtfs_static_version: null,
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

export default router;
