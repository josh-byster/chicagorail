import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate train query parameters
 * 
 * Validates that origin and destination query parameters are present and are strings
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export const validateTrainQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { origin, destination } = req.query;
  
  // Validate required parameters
  if (!origin || !destination) {
    res.status(400).json({ 
      error: 'Missing required parameters', 
      message: 'Both origin and destination query parameters are required' 
    });
    return;
  }
  
  // Validate parameter types
  if (typeof origin !== 'string' || typeof destination !== 'string') {
    res.status(400).json({ 
      error: 'Invalid parameter types', 
      message: 'Origin and destination must be strings' 
    });
    return;
  }
  
  // Validate that parameters are not empty
  if (origin.trim() === '' || destination.trim() === '') {
    res.status(400).json({ 
      error: 'Empty parameters', 
      message: 'Origin and destination cannot be empty' 
    });
    return;
  }
  
  next();
};
