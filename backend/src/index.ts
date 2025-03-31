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