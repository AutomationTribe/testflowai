import type { Response } from 'express';
import { isProduction } from '../config/env.js';
import { SESSION_COOKIE_NAME } from './session.js';

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}
