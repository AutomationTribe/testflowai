import { Router } from 'express';
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
