import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { requireAuth } from '../../middleware/auth.js';
import { resolveSubscriptionAccess } from '../subscription/subscription.service.js';

export const meRouter = Router();

/**
 * GET /me — proves the full chain: authenticated request → server-resolves user →
 * server-resolves organisation → tenant context available. Organisation is read from
 * the resolved session user, never from any client-supplied header/param (NFR-SEC-003).
 *
 * Also resolves subscription access (FR-SUB-002) using the exact same service the
 * server-side gate uses (subscriptionGate.ts) — the frontend never independently
 * infers access from dates/payment records; it only reflects what the backend says.
 */
meRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const currentUser = req.currentUser!;
    const orgResult = await pool.query<{ id: string; name: string }>(
      'SELECT id, name FROM organisations WHERE id = $1',
      [currentUser.organisationId],
    );
    const organisation = orgResult.rows[0];
    const subscription = await resolveSubscriptionAccess(currentUser.organisationId);

    res.status(200).json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
      },
      organisation: organisation ? { id: organisation.id, name: organisation.name } : null,
      subscription,
    });
  } catch (error) {
    next(error);
  }
});
