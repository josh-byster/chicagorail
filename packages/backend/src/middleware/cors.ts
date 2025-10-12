import type { CorsOptions } from 'cors';

const allowedOrigins = [
  'https://chicagorail.app',
  'https://www.chicagorail.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

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
