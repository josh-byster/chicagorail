import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';

/**
 * Get allowed origins from environment variable or use defaults for development
 * Format: CORS_ORIGIN="https://example.com,https://www.example.com"
 */
const getAllowedOrigins = (): string[] => {
  const corsOrigin = env.CORS_ORIGIN;

  if (corsOrigin) {
    // Parse comma-separated origins from environment
    return corsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // Default origins for development
  return ['http://localhost:5173', 'http://localhost:3000'];
};

const allowedOrigins = getAllowedOrigins();

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error(
        `CORS: Origin '${origin}' not allowed. Allowed origins: ${allowedOrigins.join(', ')}`
      );
      console.error(error.message);
      callback(error);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
