import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'not_found', message: 'Route not found.' });
}

/**
 * `express.json()` reports an unreadable body (bad JSON, too large, unsupported charset/encoding) as an
 * error carrying a `type` like `entity.parse.failed` and a 4xx `status` — a CLIENT mistake, so it must be
 * the approved "malformed/invalid request body" response (422 validation_error), never a 500.
 */
function bodyParserMessage(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  const { type, status } = err as { type?: unknown; status?: unknown };
  if (typeof type !== 'string' || typeof status !== 'number' || status < 400 || status >= 500) return null;
  if (type === 'entity.parse.failed') return 'The request body is not valid JSON.';
  if (type === 'entity.too.large') return 'The request body is too large.';
  if (type.startsWith('entity.') || type.startsWith('charset.') || type.startsWith('encoding.')) {
    return 'The request body could not be read.';
  }
  return null;
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
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  const unreadableBody = bodyParserMessage(err);
  if (unreadableBody) {
    res.status(422).json({ error: 'validation_error', message: unreadableBody });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error('unhandled_error', { message, path: req.path });
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong. Please try again.' });
}
