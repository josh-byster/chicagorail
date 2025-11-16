import type { CorsOptions } from 'cors';
import { env } from '../config/env.js';
import * as logger from '../utils/logger.utils.js';

/**
 * Get allowed origins from environment variable or use defaults for development
 * Format: CORS_ORIGIN="https://example.com,https://www.example.com" or "*" for all
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

/**
 * Check if origin is allowed
 * Allows all Vercel.app and chicagorail.app subdomains and explicitly configured origins
 */
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests with no origin (mobile apps, Postman, etc.)

  const allowedOrigins = getAllowedOrigins();

  // Check if "*" is in allowed origins (allow all)
  if (allowedOrigins.includes('*')) return true;

  // Check if origin is in explicit allow list
  if (allowedOrigins.includes(origin)) return true;

  // Allow all Vercel.app subdomains
  if (origin.endsWith('.vercel.app')) return true;

  // Allow all chicagorail.app subdomains (www.chicagorail.app, api.chicagorail.app, etc.)
  if (
    origin.endsWith('.chicagorail.app') ||
    origin === 'https://chicagorail.app'
  )
    return true;

  // In development mode, allow all localhost/127.0.0.1 origins
  if (env.NODE_ENV === 'development') {
    try {
      const url = new URL(origin);
      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.endsWith('.local')
      ) {
        return true;
      }
    } catch {
      // Invalid URL, reject
      return false;
    }
  }

  return false;
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      const error = new Error(
        `CORS: Origin '${origin}' not allowed. Configure CORS_ORIGIN environment variable.`
      );
      logger.error(error.message, error);
      callback(error);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
