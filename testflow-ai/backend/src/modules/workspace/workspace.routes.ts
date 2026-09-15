import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireActiveSubscription } from '../../middleware/subscriptionGate.js';

export const workspaceRouter = Router();

/**
 * GET /workspace — Slice 1's concrete, server-enforced "reaches the QA Setup boundary"
 * proof point (per the Slice 1 task's explicit instruction not to implement QA Setup
 * itself). Any real QA Setup/Project/business endpoint added in a later slice should
 * use the same `requireActiveSubscription` gate this route demonstrates.
 */
workspaceRouter.get('/workspace', requireAuth, requireActiveSubscription, (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'QA Setup boundary reached — QA Setup itself is implemented in a later slice.',
  });
});
