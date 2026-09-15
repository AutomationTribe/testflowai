import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError.js';
import { setSessionCookie } from '../lib/cookies.js';
import { resolveSession, SESSION_COOKIE_NAME, SESSION_INACTIVITY_TIMEOUT_MS } from '../lib/session.js';

/** Minimal, dependency-free single-cookie parser — avoids pulling in cookie-parser for one cookie. */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/**
 * Resolves the caller's session and attaches `req.currentUser` server-side.
 * Rejects with 401 if no valid session exists — tenant/organisation context is
 * always derived from the resolved user, never trusted from any client input.
 * Re-issues the session cookie with a fresh 30-minute window (NFR-SEC-002) so the
 * browser-held cookie's own expiry stays in step with the server-side sliding TTL.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = readCookie(req, SESSION_COOKIE_NAME);
  if (!token) {
    next(HttpError.unauthorized());
    return;
  }

  const user = await resolveSession(token);
  if (!user) {
    next(HttpError.unauthorized());
    return;
  }

  req.currentUser = user;
  setSessionCookie(res, token, new Date(Date.now() + SESSION_INACTIVITY_TIMEOUT_MS));
  next();
}
