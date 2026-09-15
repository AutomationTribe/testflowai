import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/httpError.js';
import { resolveSubscriptionAccess } from '../modules/subscription/subscription.service.js';

/**
 * FR-SUB-002: server-side, authoritative — an authenticated organisation without an
 * active trial/subscription may not reach normal platform functionality. Must run
 * after `requireAuth` (needs `req.currentUser`). The frontend route guard is a UX
 * convenience only; this is the actual enforcement point.
 */
export async function requireActiveSubscription(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const organisationId = req.currentUser?.organisationId;
  if (!organisationId) {
    next(HttpError.unauthorized());
    return;
  }

  const access = await resolveSubscriptionAccess(organisationId);
  if (!access.hasAccess) {
    next(HttpError.subscriptionRequired());
    return;
  }

  next();
}
