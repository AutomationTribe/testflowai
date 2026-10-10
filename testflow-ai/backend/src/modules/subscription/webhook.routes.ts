import { Router } from 'express';
import type { PoolClient } from 'pg';
import { pool } from '../../db/pool.js';
import { logger } from '../../lib/logger.js';
import { parsePaystackEvent, verifyPaystackSignature } from '../../lib/paystack.js';
import {
  applySuccessfulPayment,
  MAX_SEATS_PER_PURCHASE,
  sendPaymentConfirmationEmail,
  type SuccessfulPaymentInput,
} from './subscription.service.js';

export const webhookRouter = Router();

/**
 * POST /webhooks/payments — the one endpoint in the API not authenticated via TestFlow's own session
 * (api-spec.md's explicit exception). Authenticity comes from Paystack's signature only (AD-028). This is the
 * SOLE place a paid subscription/seat batch/payment is actually created — provider-confirmed state is
 * authoritative, never the browser's "payment succeeded" callback (NFR-REL-003).
 *
 * How a validly signed event is answered (TD-015). Paystack retries every non-2xx answer for days, so:
 *  - 200 for everything that can never succeed on a retry: event types TestFlow does not handle, charges TestFlow did
 *    not create or whose metadata is missing/invalid/for an unknown organisation, and duplicates. Each outcome is
 *    logged (`webhook_processed|duplicate|ignored|unattributable`, with event/reference/organisation ids, never the
 *    body, signature or e-mail address) so payments can be reconciled against the Paystack dashboard.
 *  - 500 ONLY for a genuine processing failure (database error, ...), so Paystack retries it; nothing is committed
 *    then, because the idempotency marker and the payment writes share one transaction.
 *  - 400 for a bad or missing signature and for a body that is not a Paystack event object.
 *  The handler never throws past this function (an unhandled rejection would end the Node process under Express 4).
 */
// Mounted at the exact path '/v1/webhooks/payments' in app.ts — this router's own
// path is '/' so the two don't concatenate into a doubled path.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POSITIVE_INTEGER = /^[0-9]{1,12}$/; // 12 digits keeps the value far inside Number.MAX_SAFE_INTEGER
// Paystack references are short plain tokens. A strict format keeps NUL bytes, control characters and oversized values out of
// the database and the logs (a value Postgres cannot store would otherwise be a permanent 500 retry loop).
const REFERENCE = /^[A-Za-z0-9._=-]{1,100}$/;
// numeric(10,2) holds at most 99,999,999.99 USD = 9,999,999,999 cents; seat_count is a 32-bit integer but the product cap is lower.
const MAX_AMOUNT_CENTS = 9_999_999_999;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The TestFlow metadata TestFlow itself attached when it created the transaction, validated; null when unusable. */
function readPaymentMetadata(metadata: unknown): SuccessfulPaymentInput | null {
  if (!isRecord(metadata)) return null;
  const { organisationId, planType, seatCount, usdAmountCents } = metadata;
  if (typeof organisationId !== 'string' || !UUID.test(organisationId)) return null;
  if (planType !== 'monthly' && planType !== 'yearly') return null;
  if (typeof seatCount !== 'string' || !POSITIVE_INTEGER.test(seatCount)) return null;
  if (Number(seatCount) < 1 || Number(seatCount) > MAX_SEATS_PER_PURCHASE) return null;
  if (typeof usdAmountCents !== 'string' || !POSITIVE_INTEGER.test(usdAmountCents)) return null;
  if (Number(usdAmountCents) < 1 || Number(usdAmountCents) > MAX_AMOUNT_CENTS) return null;
  return { organisationId, planType, seatCount: Number(seatCount), amountCents: Number(usdAmountCents) };
}

type Outcome =
  | { kind: 'processed'; payment: SuccessfulPaymentInput }
  | { kind: 'duplicate' }
  | { kind: 'unattributable'; reason: string };

/** Marker + payment writes in ONE transaction. Throws on genuine failures (the caller answers 500). */
async function recordChargeOnce(reference: string, payment: SuccessfulPaymentInput): Promise<Outcome> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const marker = await client.query('INSERT INTO processed_payment_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id', [
      reference,
    ]);
    if (marker.rows.length === 0) {
      // Already recorded by an earlier delivery (a retry, or a concurrent twin that committed first).
      await client.query('ROLLBACK');
      return { kind: 'duplicate' };
    }
    const organisation = await client.query('SELECT 1 FROM organisations WHERE id = $1', [payment.organisationId]);
    if (organisation.rows.length === 0) {
      await client.query('ROLLBACK'); // the marker is NOT kept: nothing was recorded
      return { kind: 'unattributable', reason: 'unknown_organisation' };
    }
    await applySuccessfulPayment(client, payment);
    await client.query('COMMIT');
    return { kind: 'processed', payment };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

webhookRouter.post('/', async (req, res) => {
  let eventType = 'unknown';
  let reference: string | undefined;
  try {
    const signature = req.header('x-paystack-signature');
    if (!signature) {
      res.status(400).json({ error: 'validation_error', message: 'Missing signature.' });
      return;
    }

    // req.body is the raw Buffer here — see app.ts, which mounts this route with
    // express.raw() BEFORE the global express.json() parser (signature verification
    // requires the exact raw bytes Paystack signed).
    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody) || !verifyPaystackSignature(rawBody, signature)) {
      logger.error('webhook_signature_invalid', {});
      res.status(400).json({ error: 'validation_error', message: 'Invalid signature.' });
      return;
    }

    let event;
    try {
      event = parsePaystackEvent(rawBody);
    } catch {
      res.status(400).json({ error: 'validation_error', message: 'Invalid event payload.' });
      return;
    }
    eventType = event.event;
    const data = isRecord(event.data) ? event.data : {};
    reference = typeof data.reference === 'string' && REFERENCE.test(data.reference) ? data.reference : undefined;
    // A rejected reference cannot be logged as-is; keep a sanitized, bounded hint so an operator can still reconcile it.
    const rejectedReferenceHint =
      reference === undefined && typeof data.reference === 'string' ? data.reference.slice(0, 40).replace(/[^A-Za-z0-9._=-]/g, '?') : undefined;

    if (event.event === 'charge.success') {
      const payment = readPaymentMetadata(data.metadata);
      if (!reference || !payment) {
        // A charge TestFlow did not create (no/invalid TestFlow metadata) can never succeed on retry.
        logger.warn('webhook_unattributable', {
          event: eventType,
          reference,
          reason: reference ? 'invalid_metadata' : 'missing_or_invalid_reference',
          ...(rejectedReferenceHint !== undefined ? { referenceHint: rejectedReferenceHint, referenceLength: (data.reference as string).length } : {}),
        });
        res.status(200).json({ received: true, ignored: true });
        return;
      }

      const outcome = await recordChargeOnce(reference, payment);
      if (outcome.kind === 'duplicate') {
        logger.info('webhook_duplicate', { event: eventType, reference });
        res.status(200).json({ received: true, duplicate: true });
        return;
      }
      if (outcome.kind === 'unattributable') {
        logger.warn('webhook_unattributable', { event: eventType, reference, reason: outcome.reason, organisationId: payment.organisationId });
        res.status(200).json({ received: true, ignored: true });
        return;
      }

      logger.info('webhook_processed', {
        event: eventType,
        reference,
        organisationId: payment.organisationId,
        planType: payment.planType,
        seatCount: payment.seatCount,
        amountCents: payment.amountCents,
      });
      // The payment is committed. The confirmation e-mail is informational (FR-SUB-006) and best effort: a failure here
      // must NOT turn into a 500, or Paystack would retry an event that is already recorded.
      try {
        const userResult = await pool.query<{ email: string }>(
          'SELECT email FROM users WHERE organisation_id = $1 ORDER BY created_at ASC LIMIT 1',
          [payment.organisationId],
        );
        const email = userResult.rows[0]?.email;
        if (email) await sendPaymentConfirmationEmail({ email, planType: payment.planType, amountCents: payment.amountCents });
      } catch (error) {
        logger.error('webhook_email_failed', { reference, organisationId: payment.organisationId, message: (error as Error).message });
      }
      res.status(200).json({ received: true });
      return;
    }

    if (event.event === 'charge.failed') {
      // FR-SUB-004/005 error condition: payment failure prevents activation. No Payment/SeatBatch/Subscription row is
      // written — see the payments table COMMENT in migrations/0002_subscription_billing.sql. The outcome is logged only.
      const metadata = isRecord(data.metadata) ? data.metadata : {};
      const text = (value: unknown): string | undefined => (typeof value === 'string' ? value.slice(0, 64) : undefined);
      logger.error('payment_failed', { reference, organisationId: text(metadata.organisationId), planType: text(metadata.planType) });
      res.status(200).json({ received: true });
      return;
    }

    // Every other event type (subscription.*, transfer.*, customeridentification.*, ...): not handled, nothing to retry.
    logger.info('webhook_ignored', { event: eventType, reference, reason: 'unhandled_event_type' });
    res.status(200).json({ received: true, ignored: true });
  } catch (error) {
    // Genuine processing failure: nothing was committed, so let Paystack retry (500).
    logger.error('webhook_processing_failed', { event: eventType, reference, message: (error as Error).message });
    if (!res.headersSent) res.status(500).json({ error: 'internal_error', message: 'Could not process event.' });
  }
});
