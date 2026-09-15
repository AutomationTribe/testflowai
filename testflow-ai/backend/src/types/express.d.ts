import type { SessionUser } from '../lib/session.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth once the session token has been resolved server-side. Never client-supplied. */
      currentUser?: SessionUser;
    }
  }
}

export {};
