import { Router } from 'express';
import { GTFSService } from '../services/gtfsService';
import type { GetRoutesResponse, ApiError } from '@chicagorail/shared';

const router = Router();
const gtfsService = GTFSService.getInstance();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const data = await gtfsService.getData();
    res.json({
      routes: data.routes
    } as GetRoutesResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch routes',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

export default router;
