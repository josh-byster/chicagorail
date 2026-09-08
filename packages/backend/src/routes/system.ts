import { Router, type Router as RouterType } from 'express';
import { GTFSService } from '../services/gtfsService';
import { RealtimeService } from '../services/realtimeService';
import type { GetSystemInfoResponse, ApiError } from '@chicagorail/shared';

const router: RouterType = Router();
const gtfsService = GTFSService.getInstance();
const realtimeService = RealtimeService.getInstance();

// Get system information including when GTFS data was last updated
router.get('/', async (req, res) => {
  try {
    const lastUpdated = await gtfsService.getLastUpdated();

    // Touch the feed so the reported timestamp reflects a live fetch
    await realtimeService.getSnapshot();

    res.json({
      lastUpdated,
      realtime: {
        enabled: realtimeService.isConfigured(),
        lastUpdated: realtimeService.getLastUpdated()
      }
    } as GetSystemInfoResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch system information',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

export default router;
