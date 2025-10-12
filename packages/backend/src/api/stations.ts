import { Router } from 'express';
import {
  getAllStations,
  getStationsByLine,
  getStationById,
  getReachableStations,
} from '../services/station.service.js';

const router: Router = Router();

/**
 * GET /stations
 *
 * Returns all stations or filters by line_id query parameter
 *
 * Query Parameters:
 * - line_id (optional): Filter stations by line ID
 *
 * Response:
 * - 200: Array of Station objects
 * - 500: Internal server error
 */
router.get('/stations', (req, res) => {
  try {
    const { line_id } = req.query;

    let stations;
    if (line_id && typeof line_id === 'string') {
      stations = getStationsByLine(line_id);
    } else {
      stations = getAllStations();
    }

    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

/**
 * GET /stations/:stationId
 *
 * Returns a single station by ID
 *
 * Path Parameters:
 * - stationId: The station ID to look up
 *
 * Response:
 * - 200: Station object
 * - 404: Station not found
 * - 500: Internal server error
 */
router.get('/stations/:stationId', (req, res) => {
  try {
    const { stationId } = req.params;

    const station = getStationById(stationId);

    if (!station) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    res.json(station);
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

/**
 * GET /stations/:stationId/reachable
 *
 * Returns all stations reachable from the given origin station
 *
 * Path Parameters:
 * - stationId: The origin station ID
 *
 * Response:
 * - 200: Array of reachable Station objects
 * - 500: Internal server error
 */
router.get('/stations/:stationId/reachable', (req, res) => {
  try {
    const { stationId } = req.params;

    const stations = getReachableStations(stationId);

    res.json(stations);
  } catch (error) {
    console.error('Error fetching reachable stations:', error);
    res.status(500).json({ error: 'Failed to fetch reachable stations' });
  }
});

export default router;
