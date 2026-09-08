// Loads packages/backend/.env for local development. Real environment
// variables take precedence, so hosted deployments are unaffected.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routesRouter from './routes/routes';
import stopsRouter from './routes/stops';
import tripsRouter from './routes/trips';
import systemRouter from './routes/system';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { GTFSService } from './services/gtfsService';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'https://www.chicagorail.app',
    'https://chicagorail.app',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json());
app.use(logger);

// Prevent caching of API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/routes', routesRouter);
app.use('/api/stops', stopsRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/system', systemRouter);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);

  // Load GTFS data after the server is already accepting connections. Parsing
  // the feed blocks the event loop for a while on a small box, so holding the
  // startup open for it means /api/health can't answer and a deploy's
  // healthcheck fails before the app ever becomes useful.
  setImmediate(async () => {
    const gtfsService = GTFSService.getInstance();
    try {
      await gtfsService.initialize();
      gtfsService.startBackgroundRefresh();
    } catch (error) {
      // Requests will retry the load themselves via getData()
      console.error('GTFS initialization failed', error);
    }
  });
});
