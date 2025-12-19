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

app.listen(port, async () => {
  console.log(`Backend running on port ${port}`);

  // Initialize GTFS service with fresh data and start background refresh
  const gtfsService = GTFSService.getInstance();
  await gtfsService.initialize();
  gtfsService.startBackgroundRefresh();
});
