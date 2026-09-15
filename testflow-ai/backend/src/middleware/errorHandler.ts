import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'not_found', message: 'Route not found.' });
}

/** Central error handler — always the shared envelope (APID-007), never a raw stack trace to the client. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error(err.message, { error: err.error, path: req.path });
    }
    res.status(err.status).json({
      error: err.error,
      message: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error('unhandled_error', { message, path: req.path });
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong. Please try again.' });
}
