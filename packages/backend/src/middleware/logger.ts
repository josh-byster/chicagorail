import type { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log incoming request with details
  const origin = req.get('origin') || req.get('referer') || 'no-origin';
  console.log(
    `🔵 [${new Date().toISOString()}] Incoming: ${req.method} ${req.originalUrl || req.url}`
  );
  console.log(`   Origin: ${origin}`);
  console.log(`   User-Agent: ${req.get('user-agent') || 'unknown'}`);

  // Log response details on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const emoji =
      res.statusCode >= 500 ? '🔴' : res.statusCode >= 400 ? '🟡' : '🟢';
    console.log(
      `${emoji} [${new Date().toISOString()}] Response: ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`
    );
  });

  // Log any errors during request processing
  res.on('error', (error) => {
    console.error(
      `🔴 [${new Date().toISOString()}] Error: ${req.method} ${req.originalUrl || req.url}`,
      error
    );
  });

  next();
};
