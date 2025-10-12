import { Router } from 'express';
import { getAllLines, getLineById } from '../services/line.service';

const router: Router = Router();

/**
 * GET /lines
 * 
 * Returns all train lines
 * 
 * Query Parameters:
 * - None
 * 
 * Response:
 * - 200: Array of Line objects
 * - 500: Internal server error
 */
router.get('/lines', (_req, res) => {
  try {
    const lines = getAllLines();
    res.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    res.status(500).json({ error: 'Failed to fetch lines' });
  }
});

/**
 * GET /lines/:lineId
 * 
 * Returns detailed line information including all stations
 * 
 * Path Parameters:
 * - lineId (required): The line ID to look up
 * 
 * Response:
 * - 200: Line object with all stations
 * - 404: Line not found
 * - 500: Internal server error
 */
router.get('/lines/:lineId', (req, res) => {
  try {
    const { lineId } = req.params;
    
    const line = getLineById(lineId);
    
    if (!line) {
      res.status(404).json({ error: 'Line not found' });
      return;
    }
    
    res.json(line);
  } catch (error) {
    console.error('Error fetching line detail:', error);
    res.status(500).json({ error: 'Failed to fetch line detail' });
  }
});

export default router;
