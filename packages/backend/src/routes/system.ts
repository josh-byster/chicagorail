import { Router, type Router as RouterType } from 'express';
import { GTFSService } from '../services/gtfsService';
import type { GetSystemInfoResponse, ApiError } from '@chicagorail/shared';

const router: RouterType = Router();
const gtfsService = GTFSService.getInstance();

// Get system information including when GTFS data was last updated
router.get('/', async (req, res) => {
  try {
    const lastUpdated = await gtfsService.getLastUpdated();
    res.json({
      lastUpdated
    } as GetSystemInfoResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch system information',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

export default router;
