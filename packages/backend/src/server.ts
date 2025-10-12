import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';
import { corsOptions } from './middleware/cors';
import { env } from './config/env';

// Load environment variables
dotenv.config();

const app = express();
const PORT = env.PORT;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes will be registered here
// app.use('/api/stations', stationRoutes);
// app.use('/api/trains', trainRoutes);
// app.use('/api/lines', lineRoutes);
// app.use('/api/alerts', alertRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚆 Metra Train Tracker API running on port ${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Database: ${env.DATABASE_PATH}`);
});

export default app;
