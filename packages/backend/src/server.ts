import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';
import { corsOptions } from './middleware/cors';
import { env } from './config/env';
import stationRoutes from './api/stations';
import trainRoutes from './api/trains';
import alertRoutes from './api/alerts';
import lineRoutes from './api/lines';
import healthRoutes from './api/health';
import { validateTrainQueryParams } from './middleware/validate-trains';

// Load environment variables
dotenv.config();

const app: express.Application = express();
const PORT = env.PORT;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes
app.use('/api', stationRoutes);
app.use('/api', validateTrainQueryParams, trainRoutes);
app.use('/api', alertRoutes);
app.use('/api', lineRoutes);
app.use('/api', healthRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚆 Metra Train Tracker API running on port ${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Database: ${env.DATABASE_PATH}`);
});

export default app;
