import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError.js';
import { isTrustedOrigin, originOfUrl } from '../lib/origin.js';
import { logger } from '../lib/logger.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function reject(req: Request, reason: string, detail: Record<string, unknown>): HttpError {
  // Method and path only; never headers other than the origin values, never cookies or bodies.
  logger.warn('forbidden_origin', { method: req.method, path: req.path, reason, ...detail });
  return new HttpError(403, 'forbidden_origin', 'This request came from an origin that is not allowed.');
}

/**
 * CSRF defence for state-changing requests (TD-011). The session cookie is `SameSite=None` in production
 * (frontend and backend are different sites), so the browser attaches it to cross-site requests and
 * something other than the cookie must prove the request came from our own frontend.
 *
 * Applies to every method except GET/HEAD/OPTIONS (reads are protected by CORS, not by this check).
 *
 * 1. `Origin` present  -> must be a trusted origin; the literal "null" and everything else is rejected.
 *    Browsers always send `Origin` on a cross-site POST, so a forged form/fetch cannot omit it.
 * 2. `Origin` absent:
 *    a. `Sec-Fetch-Site: cross-site` -> rejected (a browser that reports a cross-site request but sent
 *       no Origin is anomalous; do not trust it).
 *    b. `Referer` present -> its origin must be trusted (unparseable -> rejected).
 *    c. Neither -> ALLOWED. This is deliberate: non-browser clients (server-to-server callers, curl,
 *       health probes, the Playwright APIRequestContext, the Paystack webhook) send no Origin, and they
 *       have no ambient browser cookie for an attacker to ride; they must still authenticate themselves.
 */
export function requireTrustedOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get('origin');
  if (origin !== undefined) {
    if (isTrustedOrigin(origin)) {
      next();
      return;
    }
    next(reject(req, 'untrusted_origin', { origin: origin.slice(0, 200) }));
    return;
  }

  if (req.get('sec-fetch-site') === 'cross-site') {
    next(reject(req, 'cross_site_without_origin', {}));
    return;
  }

  const referer = req.get('referer');
  if (referer !== undefined) {
    const refererOrigin = originOfUrl(referer);
    if (refererOrigin !== null && isTrustedOrigin(refererOrigin)) {
      next();
      return;
    }
    next(reject(req, 'untrusted_referer', { referer: referer.slice(0, 200) }));
    return;
  }

  next();
}
