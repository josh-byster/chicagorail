import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/logger.js';
import { corsOptions } from './middleware/cors.js';
import { env } from './config/env.js';
import stationRoutes from './api/stations.js';
import trainRoutes from './api/trains.js';
import alertRoutes from './api/alerts.js';
import lineRoutes from './api/lines.js';
import healthRoutes from './api/health.js';
import { initializeOnStartup } from './services/startup.service.js';

const app: express.Application = express();
const PORT = env.PORT || 3000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes
app.use('/api', stationRoutes);
app.use('/api', trainRoutes);
app.use('/api', alertRoutes);
app.use('/api', lineRoutes);
app.use('/api', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Initialize database and start background tasks
    await initializeOnStartup();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Metra Train Tracker API running on port ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Database: ${env.DATABASE_PATH}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
