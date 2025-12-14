import { Request, Response, NextFunction } from 'express';
import { winstonLogger } from './logger';
import type { ApiError } from '@chicagorail/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  winstonLogger.error('Error:', err);

  const error: ApiError = {
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  res.status(500).json(error);
}
