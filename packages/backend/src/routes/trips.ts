import { Router, type Router as RouterType } from 'express';
import type { FindDirectTripsResponse } from '@chicagorail/shared';
import { GTFSService } from '../services/gtfsService';

const router: RouterType = Router();
const gtfsService = GTFSService.getInstance();

// GET /api/trips/direct?origin=STOP_ID&destination=STOP_ID&limit=10
router.get('/direct', async (req, res, next) => {
  try {
    const { origin, destination, limit } = req.query;

    if (!origin || !destination) {
      res.status(400).json({
        error: 'Missing required parameters: origin and destination',
        code: 'MISSING_PARAMS'
      });
      return;
    }

    if (origin === destination) {
      res.status(400).json({
        error: 'Origin and destination cannot be the same',
        code: 'SAME_STATION'
      });
      return;
    }

    const limitNum = limit ? parseInt(limit as string) : 10;

    const result = await gtfsService.findDirectTrips(
      origin as string,
      destination as string,
      new Date(),
      limitNum
    );

    const response: FindDirectTripsResponse = result;

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
