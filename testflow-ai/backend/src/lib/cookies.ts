import type { Response } from 'express';
import { isProduction } from '../config/env.js';
import { SESSION_COOKIE_NAME } from './session.js';

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    // Production: frontend and backend deploy as two different origins (separate
    // Render services, no shared custom domain), and the frontend calls the
    // backend via cross-origin fetch(credentials:'include') — SameSite=Lax is
    // NOT sent on cross-site fetch/XHR by any modern browser, which would make
    // every authenticated request 401 immediately after a successful login.
    // 'None' requires secure:true, which production already sets above.
    // Development: frontend/backend share the localhost origin family, so 'lax'
    // stays the safer default there.
    sameSite: isProduction ? 'none' : 'lax',
    expires: expiresAt,
    path: '/',
  });
}
