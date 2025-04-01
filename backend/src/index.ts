import express from 'express';
import cors from 'cors';
import { GTFSService } from './gtfsService';
import { logger } from './logger';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize GTFS service
const gtfsService = GTFSService.getInstance();

// Routes endpoint
app.get('/api/routes', async (req, res) => {
  try {
    const data = await gtfsService.getData();
    res.json(data.routes);
  } catch (error) {
    logger.error('Error serving routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Search stops endpoint
app.get('/api/search/stops', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const data = await gtfsService.getData();
    const matchingStops = data.stops.filter(stop => 
      stop.stop_name.toLowerCase().includes(query.toLowerCase())
    );

    // Get routes that service these stops
    const routesWithStops = data.routes.filter(route => {
      return data.trips.some(trip => 
        trip.route_id === route.route_id &&
        trip.stopTimes.some(stopTime => 
          matchingStops.some(stop => stop.stop_id === stopTime.stop_id)
        )
      );
    });

    res.json({
      stops: matchingStops,
      routes: routesWithStops
    });
  } catch (error) {
    logger.error('Error searching stops:', error);
    res.status(500).json({ error: 'Failed to search stops' });
  }
});

// Trips endpoint
app.get('/api/routes/:routeId/trips', async (req, res) => {
  try {
    const { routeId } = req.params;
    const date = new Date(req.query.date as string || new Date().toISOString());
    const trips = await gtfsService.getTripsByRoute(routeId, date);
    res.json(trips);
  } catch (error) {
    logger.error('Error serving trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 