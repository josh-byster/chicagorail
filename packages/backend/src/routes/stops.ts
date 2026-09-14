import { Router, type Router as RouterType } from 'express';
import { GTFSService } from '../services/gtfsService';
import { RealtimeService } from '../services/realtimeService';
import { enrichArrivals, enrichDepartures } from '../services/realtimeEnrichment';
import type {
  SearchStopsRequest,
  SearchStopsResponse,
  GetDeparturesRequest,
  GetDeparturesResponse,
  GetArrivalsRequest,
  GetArrivalsResponse,
  ApiError
} from '@chicagorail/shared';
import { utils } from '@chicagorail/shared';

const router: RouterType = Router();
const gtfsService = GTFSService.getInstance();
const realtimeService = RealtimeService.getInstance();

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

    const response: SearchStopsResponse = {
      stops: rankedStops.slice(0, 10)
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search stops',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

// All stations, with direct connections for the opposite endpoint of a trip.
router.get('/:stopId/connections', async (req, res) => {
  const { field, date } = req.query;
  if ((field !== 'from' && field !== 'to') || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'A valid date and field are required', code: 'INVALID_QUERY' });
  }
  const queryDate = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(queryDate.getTime()) || queryDate.toISOString().slice(0, 10) !== date) {
    return res.status(400).json({ error: 'Invalid date', code: 'INVALID_QUERY' });
  }
  try {
    const result = await gtfsService.getStopConnections(req.params.stopId, field, queryDate);
    if (!result) return res.status(404).json({ error: 'Station not found', code: 'NOT_FOUND' });
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to check direct connections', code: 'INTERNAL_ERROR' });
  }
});

// Get departures for a stop
router.get('/:stopId/departures', async (req, res) => {
  try {
    const { stopId } = req.params;
    const { date, limit = '20', routeId } = req.query as Partial<GetDeparturesRequest>;

    // Parse date as local time, not UTC
    // Date string format: YYYY-MM-DD
    let queryDate = new Date();
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      queryDate = new Date(year, month - 1, day); // month is 0-indexed
    }

    const departures = await gtfsService.getDeparturesForStop(
      stopId,
      queryDate,
      Number(limit),
      routeId
    );

    const snapshot = await realtimeService.getSnapshot();

    const response: GetDeparturesResponse = {
      stop: departures.stop,
      departures: enrichDepartures(departures.departures, stopId, snapshot),
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch departures',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

// Get arrivals for a stop
router.get('/:stopId/arrivals', async (req, res) => {
  try {
    const { stopId } = req.params;
    const { date, limit = '20', routeId } = req.query as Partial<GetArrivalsRequest>;

    // Parse date as local time, not UTC
    // Date string format: YYYY-MM-DD
    let queryDate = new Date();
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      queryDate = new Date(year, month - 1, day); // month is 0-indexed
    }

    const arrivals = await gtfsService.getArrivalsForStop(
      stopId,
      queryDate,
      Number(limit),
      routeId
    );

    const snapshot = await realtimeService.getSnapshot();

    const response: GetArrivalsResponse = {
      stop: arrivals.stop,
      arrivals: enrichArrivals(arrivals.arrivals, stopId, snapshot),
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch arrivals',
      code: 'INTERNAL_ERROR'
    } as ApiError);
  }
});

export default router;
