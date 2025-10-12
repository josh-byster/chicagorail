import { Router } from 'express';
import { getUpcomingTrains, getTrainDetail } from '../services/train.service';

const router: Router = Router();

/**
 * GET /trains
 * 
 * Returns upcoming trains between origin and destination stations
 * 
 * Query Parameters:
 * - origin (required): Origin station ID
 * - destination (required): Destination station ID
 * - limit (optional): Maximum number of trains to return
 * - time (optional): Time to search from (defaults to current time)
 * 
 * Response:
 * - 200: Array of Train objects
 * - 400: Missing required parameters
 * - 500: Internal server error
 */
router.get('/trains', (req, res) => {
  try {
    const { origin, destination, limit, time } = req.query;
    
    // Parse limit as number if provided
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    if (limit && (isNaN(limitNum as number) || (limitNum as number) <= 0)) {
      res.status(400).json({ error: 'Limit must be a positive number' });
      return;
    }
    
    // Get upcoming trains
    const trains = getUpcomingTrains(origin as string, destination as string, limitNum, time as string | undefined);
    
    res.json(trains);
  } catch (error) {
    console.error('Error fetching trains:', error);
    res.status(500).json({ error: 'Failed to fetch trains' });
  }
});

/**
 * GET /trains/:tripId
 * 
 * Returns detailed train information including all stops
 * 
 * Path Parameters:
 * - tripId (required): The trip ID to look up
 * 
 * Response:
 * - 200: Train object with all stops
 * - 404: Train not found
 * - 500: Internal server error
 */
router.get('/trains/:tripId', (req, res) => {
  try {
    const { tripId } = req.params;
    
    const train = getTrainDetail(tripId);
    
    if (!train) {
      res.status(404).json({ error: 'Train not found' });
      return;
    }
    
    res.json(train);
  } catch (error) {
    console.error('Error fetching train detail:', error);
    res.status(500).json({ error: 'Failed to fetch train detail' });
  }
});

export default router;
