import { Router } from 'express';
import { GTFSService } from '../services/gtfsService';
import type {
  SearchStopsRequest,
  SearchStopsResponse,
  GetDeparturesRequest,
  GetDeparturesResponse,
  ApiError
} from '@chicagorail/shared';
import { utils } from '@chicagorail/shared';

const router = Router();
const gtfsService = GTFSService.getInstance();

// Search stops
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query as unknown as SearchStopsRequest;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters',
        code: 'INVALID_QUERY'
      } as ApiError);
    }

    const data = await gtfsService.getData();
    const matchingStops = data.stops.filter(stop =>
      stop.stop_name.toLowerCase().includes(q.toLowerCase())
    );

    const rankedStops = utils.rankSearchResults(q, matchingStops);

    res.json({
      stops: rankedStops.slice(0, 10)
    } as SearchStopsResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search stops',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

// Get departures for a stop
router.get('/:stopId/departures', async (req, res) => {
  try {
    const { stopId } = req.params;
    const { date, limit = '20', routeId } = req.query as Partial<GetDeparturesRequest>;

    const departures = await gtfsService.getDeparturesForStop(
      stopId,
      date ? new Date(date) : new Date(),
      Number(limit),
      routeId
    );

    res.json({
      stop: departures.stop,
      departures: departures.departures,
      timestamp: new Date().toISOString()
    } as GetDeparturesResponse);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch departures',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

export default router;
