import express from 'express';
import cors from 'cors';
import routesRouter from '../../src/routes/routes.js';
import stopsRouter from '../../src/routes/stops.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { logger } from '../../src/middleware/logger.js';

/**
 * Create Express app for testing (without starting the server)
 */
export function createTestApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(logger);

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/routes', routesRouter);
  app.use('/api/stops', stopsRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}
