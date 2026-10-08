import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { HttpError } from '../../lib/httpError.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireOwnOrganisation, requireBillingRole } from '../subscription/subscription.routes.js';
import { recordSuccessfulPayment, sendPaymentConfirmationEmail } from '../subscription/subscription.service.js';

export const testSupportRouter = Router();

/**
 * E2E-only endpoint (Slice 1 E2E closure). Mounted in app.ts ONLY when
 * `E2E_FAKE_PAYMENTS=true` AND the process is not production (double-gated —
 * see app.ts). Stands in for Paystack's webhook so Playwright can deterministically
 * exercise Flow B (payment succeeds) and Flow D (payment fails) without any real
 * Paystack account or network call. On 'succeeded' it runs the exact same
 * reconciliation used by the real webhook handler (recordSuccessfulPayment) —
 * only the transport (Paystack webhook vs. this endpoint) differs, not the domain
 * logic being exercised. On 'failed' it deliberately does nothing, matching the
 * real webhook handler's "no billing record on failure" behaviour.
 */
testSupportRouter.post('/test-support/simulate-payment', requireAuth, async (req, res, next) => {
  try {
    const { organisationId, planType, seatCount, amountCents, outcome } = req.body ?? {};
    requireOwnOrganisation(req, organisationId);
    requireBillingRole(req);

    if (
      (planType !== 'monthly' && planType !== 'yearly') ||
      typeof seatCount !== 'number' ||
      typeof amountCents !== 'number' ||
      (outcome !== 'succeeded' && outcome !== 'failed')
    ) {
      throw HttpError.validation('Invalid simulate-payment request.');
    }

    if (outcome === 'failed') {
      res.status(200).json({ simulated: 'failed' });
      return;
    }

    await recordSuccessfulPayment({ organisationId, planType, seatCount, amountCents });

    const email = req.currentUser!.email;
    await sendPaymentConfirmationEmail({ email, planType, amountCents });

    res.status(200).json({ simulated: 'succeeded' });
  } catch (error) {
    next(error);
  }
});

/**
 * E2E-only (same double gate as above: `E2E_FAKE_PAYMENTS=true` and never production).
 * Puts the CALLER'S OWN organisation back to "no projects, next code PRJ-001" so the shared
 * dedicated E2E tester account can start every Projects test from a known empty state without
 * a new sign-up. Organisation comes from the session, never the request; nothing else is touched.
 */
testSupportRouter.post('/test-support/reset-projects', requireAuth, async (req, res, next) => {
  try {
    const organisationId = req.currentUser!.organisationId;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM project_memberships WHERE project_id IN (SELECT id FROM projects WHERE organisation_id = $1)',
        [organisationId],
      );
      await client.query('DELETE FROM projects WHERE organisation_id = $1', [organisationId]);
      await client.query('UPDATE organisations SET next_project_number = 1 WHERE id = $1', [organisationId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

/**
 * E2E-only (same double gate). Sets a project's status in the CALLER'S OWN organisation, so the
 * list's Archived tab/filter can be exercised before archiving (FR-PRJ-003) exists as a feature.
 */
testSupportRouter.post('/test-support/set-project-status', requireAuth, async (req, res, next) => {
  try {
    const { projectId, status } = req.body ?? {};
    if (typeof projectId !== 'string' || (status !== 'active' && status !== 'archived')) {
      throw HttpError.validation('Invalid set-project-status request.');
    }
    const result = await pool.query('UPDATE projects SET status = $1 WHERE id = $2 AND organisation_id = $3', [
      status,
      projectId,
      req.currentUser!.organisationId,
    ]);
    if (result.rowCount === 0) throw HttpError.notFound();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
