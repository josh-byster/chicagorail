import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import * as logger from '../utils/logger.utils.js';
import {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
} from '../utils/errors.js';

export const errorHandler = (
  err: AppError | ZodError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Custom application errors
  if (err instanceof AppError) {
    logger.error(`${err.constructor.name}: ${err.message}`, err);
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Unknown errors
  logger.error('Unexpected error', err);
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Re-export error classes for convenience
export {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
};

// Deprecated: Use AppError instead
export class HttpError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true
  ) {
    super(message, statusCode, isOperational);
  }
}
