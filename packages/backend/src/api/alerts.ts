import { Router } from 'express';
import { getActiveAlerts } from '../services/alert.service';

const router: Router = Router();

/**
 * GET /alerts
 * 
 * Returns active service alerts
 * 
 * Query Parameters:
 * - line_id (optional): Filter alerts by line ID
 * - station_id (optional): Filter alerts by station ID
 * 
 * Response:
 * - 200: Array of ServiceAlert objects
 * - 500: Internal server error
 */
router.get('/alerts', (req, res) => {
  try {
    const { line_id, station_id } = req.query;
    
    const alerts = getActiveAlerts(
      line_id as string | undefined,
      station_id as string | undefined
    );
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;
