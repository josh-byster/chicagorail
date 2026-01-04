import { Router, type Router as RouterType } from 'express';
import type { FindDirectTripsResponse, GetTripDetailsResponse } from '@chicagorail/shared';
import { GTFSService } from '../services/gtfsService';

const router: RouterType = Router();
const gtfsService = GTFSService.getInstance();

// GET /api/trips/direct?origin=STOP_ID&destination=STOP_ID&limit=10&date=YYYY-MM-DD
router.get('/direct', async (req, res, next) => {
  try {
    const { origin, destination, limit, date } = req.query;

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

    // Parse date parameter - if provided, use start of that day in local time
    let queryDate = new Date();
    if (date) {
      const [year, month, day] = (date as string).split('-').map(Number);
      queryDate = new Date(year, month - 1, day, 2, 0, 0); // 2am local time
    }

    const result = await gtfsService.findDirectTrips(
      origin as string,
      destination as string,
      queryDate,
      limitNum
    );

    const response: FindDirectTripsResponse = result;

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/trips/:tripId?date=YYYY-MM-DD
router.get('/:tripId', async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { date } = req.query;

    const queryDate = date ? new Date(date as string) : new Date();

    const result = await gtfsService.getTripDetails(tripId, queryDate);

    if (!result) {
      res.status(404).json({
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND'
      });
      return;
    }

    const response: GetTripDetailsResponse = result;
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
