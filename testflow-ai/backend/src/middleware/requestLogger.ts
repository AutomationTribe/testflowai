import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

/** Logs method/path/status/duration only — never headers, cookies, or bodies (no credentials logged). */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
}
