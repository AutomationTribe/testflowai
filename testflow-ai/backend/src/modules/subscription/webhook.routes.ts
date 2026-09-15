import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { logger } from '../../lib/logger.js';
import { parsePaystackEvent, verifyPaystackSignature } from '../../lib/paystack.js';
import { recordSuccessfulPayment, sendPaymentConfirmationEmail } from './subscription.service.js';

export const webhookRouter = Router();

/**
 * POST /webhooks/payments — the one endpoint in the API not authenticated via
 * TestFlow's own session (api-spec.md's explicit exception). Authenticity comes
 * from Paystack's signature only (AD-028). This is the SOLE place a paid
 * subscription/seat batch/payment is actually created — provider-confirmed state
 * is authoritative, never the browser's "payment succeeded" callback (NFR-REL-003).
 */
// Mounted at the exact path '/v1/webhooks/payments' in app.ts — this router's own
// path is '/' so the two don't concatenate into a doubled path.
webhookRouter.post('/', async (req, res) => {
  const signature = req.header('x-paystack-signature');
  if (!signature) {
    res.status(400).json({ error: 'validation_error', message: 'Missing signature.' });
    return;
  }

  // req.body is the raw Buffer here — see app.ts, which mounts this route with
  // express.raw() BEFORE the global express.json() parser (signature verification
  // requires the exact raw bytes Paystack signed).
  const rawBody = req.body as Buffer;
  if (!verifyPaystackSignature(rawBody, signature)) {
    logger.error('webhook_signature_invalid', {});
    res.status(400).json({ error: 'validation_error', message: 'Invalid signature.' });
    return;
  }

  const event = parsePaystackEvent(rawBody);
  const reference = event.data.reference;

  // Idempotent: a redelivered event (Paystack retries on any non-2xx, or an
  // operator replay) is a guaranteed no-op once the reference has been recorded.
  const inserted = await pool.query(
    'INSERT INTO processed_payment_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id',
    [reference],
  );
  if (inserted.rows.length === 0) {
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  try {
    if (event.event === 'charge.success') {
      const { organisationId, planType, seatCount, usdAmountCents } = event.data.metadata;
      if (
        !organisationId ||
        !planType ||
        !seatCount ||
        !Number.isInteger(Number(seatCount)) ||
        !usdAmountCents ||
        !Number.isInteger(Number(usdAmountCents))
      ) {
        throw new Error(`charge.success missing/invalid metadata for reference ${reference}`);
      }
      // TestFlow's own ledger stays in the original USD cents the customer was
      // quoted (FR-SUB-004/005) — never the NGN amount Paystack actually settled
      // (see lib/paystack.ts's fixed-rate conversion note).
      const amountCents = Number(usdAmountCents);

      await recordSuccessfulPayment({
        organisationId,
        planType: planType as 'monthly' | 'yearly',
        seatCount: Number(seatCount),
        amountCents,
      });

      const userResult = await pool.query<{ email: string }>(
        'SELECT email FROM users WHERE organisation_id = $1 ORDER BY created_at ASC LIMIT 1',
        [organisationId],
      );
      const email = userResult.rows[0]?.email;
      if (email) {
        await sendPaymentConfirmationEmail({
          email,
          planType: planType as 'monthly' | 'yearly',
          amountCents,
        });
      }
    } else if (event.event === 'charge.failed') {
      // FR-SUB-004/005 error condition: payment failure prevents activation. No
      // Payment/SeatBatch/Subscription row is written — see payments table COMMENT
      // in migrations/0002_subscription_billing.sql for why a failed attempt isn't
      // persisted as a billing record. The outcome is still observable via logging.
      logger.error('payment_failed', {
        organisationId: event.data.metadata.organisationId,
        planType: event.data.metadata.planType,
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('webhook_processing_failed', { reference, message: (error as Error).message });
    // Let Paystack retry: remove the processed-marker so a retry isn't swallowed as a duplicate.
    await pool.query('DELETE FROM processed_payment_events WHERE event_id = $1', [reference]);
    res.status(500).json({ error: 'internal_error', message: 'Could not process event.' });
  }
});
