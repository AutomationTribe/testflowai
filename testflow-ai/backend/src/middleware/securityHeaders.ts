import type { NextFunction, Request, Response } from 'express';
import { env, isProduction } from '../config/env.js';

/**
 * Baseline security headers for a JSON API (no HTML is ever served from here, so the policy is
 * "nothing may load or frame this"). Hand-written on purpose: five headers do not justify a new
 * dependency (CLAUDE.md rule 26).
 *
 * Swagger UI (`/docs`, only when enabled; off in production) is a real page that needs scripts and
 * styles, so it is exempt from the Content-Security-Policy and framing headers only.
 */
const HSTS_MAX_AGE_SECONDS = 300; // deliberately short for the first release; HSTS is sticky in browsers

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const isSwaggerUi = env.swaggerUiEnabled && (req.path === '/docs' || req.path.startsWith('/docs/') || req.path === '/docs.json');
  if (!isSwaggerUi) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
  }
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', `max-age=${HSTS_MAX_AGE_SECONDS}`);
  }
  next();
}

/** API responses carry tenant data and set/clear sessions: they must never be stored by a browser or an intermediary cache. */
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store');
  next();
}
