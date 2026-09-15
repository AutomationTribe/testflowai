import { pool } from '../../db/pool.js';
import { HttpError } from '../../lib/httpError.js';
import { enqueueEmailJob, processPendingJobs } from '../../lib/jobs.js';

const TRIAL_DAYS = 14;
const TRIAL_SEAT_CAP = 3;
const MONTHLY_PRICE_CENTS_PER_SEAT = 1000; // $10.00 (FR-SUB-004)
const YEARLY_PRICE_CENTS_PER_SEAT_PER_MONTH = 900; // $9.00/seat/month × 12 (FR-SUB-005)
const YEARLY_MONTHS = 12;

export type PlanType = 'trial' | 'monthly' | 'yearly';

export interface SubscriptionRow {
  id: string;
  organisation_id: string;
  plan_type: PlanType;
  status: 'active' | 'grace_period' | 'blocked';
  started_at: Date;
  trial_ends_at: Date | null;
  grace_period_ends_at: Date | null;
}

export interface SubscriptionAccess {
  hasAccess: boolean;
  planType: PlanType | null;
  status: 'none' | 'trial_active' | 'trial_expired' | 'active' | 'grace_period' | 'blocked';
  trialEndsAt: string | null;
  gracePeriodEndsAt: string | null;
  seatsTotal: number;
}

/**
 * Single source of truth for "does this organisation currently have platform access"
 * (FR-SUB-002). Computed fresh from stored facts every time — never a client-trusted
 * flag — and called identically by the access-gate middleware and by GET /v1/me, so
 * there is exactly one implementation of this rule (same principle as AD-022).
 */
export async function resolveSubscriptionAccess(organisationId: string): Promise<SubscriptionAccess> {
  const subResult = await pool.query<SubscriptionRow>(
    'SELECT * FROM subscriptions WHERE organisation_id = $1',
    [organisationId],
  );
  const seatsResult = await pool.query<{ total: string }>(
    'SELECT COALESCE(SUM(seat_count), 0) AS total FROM seat_batches WHERE organisation_id = $1',
    [organisationId],
  );
  const seatsTotal = Number(seatsResult.rows[0]?.total ?? 0);

  const sub = subResult.rows[0];
  if (!sub) {
    return { hasAccess: false, planType: null, status: 'none', trialEndsAt: null, gracePeriodEndsAt: null, seatsTotal };
  }

  if (sub.plan_type === 'trial') {
    // Trial expiry is date-based and has NO grace period (FR-SUB-010), evaluated live —
    // never trusting a stored 'active' status past the trial's own end date.
    const expired = sub.trial_ends_at !== null && sub.trial_ends_at.getTime() <= Date.now();
    return {
      hasAccess: !expired,
      planType: 'trial',
      status: expired ? 'trial_expired' : 'trial_active',
      trialEndsAt: sub.trial_ends_at?.toISOString() ?? null,
      gracePeriodEndsAt: null,
      seatsTotal,
    };
  }

  // Paid plans: stored status is authoritative (active / grace_period / blocked).
  // No automatic lapse-detection/renewal exists in this slice (deferred — see
  // requirements-change-log.md) so a paid subscription stays 'active' unless/until
  // something explicitly marks it otherwise.
  const hasAccess = sub.status === 'active' || sub.status === 'grace_period';
  return {
    hasAccess,
    planType: sub.plan_type,
    status: sub.status,
    trialEndsAt: null,
    gracePeriodEndsAt: sub.grace_period_ends_at?.toISOString() ?? null,
    seatsTotal,
  };
}

/**
 * FR-SUB-001/PD-021: 14-day, 3-seat, once-per-organisation trial. Row-locks the
 * organisation to make the "has this org ever used a trial" check-and-set atomic
 * against a concurrent double-submit (in addition to the Idempotency-Key layer above
 * this in the route handler, which handles the exact-retry case).
 */
export async function activateTrial(organisationId: string): Promise<SubscriptionRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orgResult = await client.query<{ trial_used: boolean; name: string }>(
      'SELECT trial_used, name FROM organisations WHERE id = $1 FOR UPDATE',
      [organisationId],
    );
    const org = orgResult.rows[0];
    if (!org) throw HttpError.notFound();
    if (org.trial_used) {
      throw HttpError.conflict('This organisation has already used its trial.');
    }

    const startedAt = new Date();
    const trialEndsAt = new Date(startedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const subResult = await client.query<SubscriptionRow>(
      `INSERT INTO subscriptions (organisation_id, plan_type, status, started_at, trial_ends_at)
       VALUES ($1, 'trial', 'active', $2, $3)
       RETURNING *`,
      [organisationId, startedAt, trialEndsAt],
    );
    await client.query(
      `INSERT INTO seat_batches (organisation_id, seat_count, plan_type_at_purchase, amount_charged)
       VALUES ($1, $2, 'trial', 0)`,
      [organisationId, TRIAL_SEAT_CAP],
    );
    await client.query('UPDATE organisations SET trial_used = true WHERE id = $1', [organisationId]);

    await client.query('COMMIT');
    return subResult.rows[0]!;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function calculateAmountCents(planType: 'monthly' | 'yearly', seatCount: number): number {
  if (planType === 'monthly') return seatCount * MONTHLY_PRICE_CENTS_PER_SEAT;
  return seatCount * YEARLY_PRICE_CENTS_PER_SEAT_PER_MONTH * YEARLY_MONTHS;
}

export function validateSeatCount(seatCount: unknown): number {
  if (typeof seatCount !== 'number' || !Number.isInteger(seatCount) || seatCount < 1) {
    throw HttpError.validation('Seat count must be a positive whole number.', { seatCount: 'Must be a positive integer.' });
  }
  if (seatCount > 1000) {
    throw HttpError.validation('Seat count is too large.', { seatCount: 'Must be 1000 or fewer per purchase.' });
  }
  return seatCount;
}

/**
 * Reconciles a Paystack-confirmed successful payment into TestFlow's own state
 * (NFR-REL-003): one transaction creates the Seat Batch, the Payment record, and
 * activates/updates the Subscription. Only ever called after provider confirmation
 * (from the webhook handler) — never speculatively on the client's say-so.
 */
export async function recordSuccessfulPayment(input: {
  organisationId: string;
  planType: 'monthly' | 'yearly';
  seatCount: number;
  amountCents: number;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const amount = (input.amountCents / 100).toFixed(2);
    const renewsAt =
      input.planType === 'yearly'
        ? new Date(Date.now() + YEARLY_MONTHS * 30 * 24 * 60 * 60 * 1000) // PD-027: independent 12-month term per batch
        : null;

    const seatBatchResult = await client.query<{ id: string }>(
      `INSERT INTO seat_batches (organisation_id, seat_count, plan_type_at_purchase, amount_charged, renews_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.organisationId, input.seatCount, input.planType, amount, renewsAt],
    );
    const seatBatchId = seatBatchResult.rows[0]!.id;

    await client.query(
      `INSERT INTO payments (organisation_id, seat_batch_id, amount, plan_type, status)
       VALUES ($1, $2, $3, $4, 'succeeded')`,
      [input.organisationId, seatBatchId, amount, input.planType],
    );

    const existing = await client.query('SELECT id FROM subscriptions WHERE organisation_id = $1', [
      input.organisationId,
    ]);
    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE subscriptions SET plan_type = $2, status = 'active', grace_period_ends_at = NULL WHERE organisation_id = $1`,
        [input.organisationId, input.planType],
      );
    } else {
      await client.query(
        `INSERT INTO subscriptions (organisation_id, plan_type, status, started_at) VALUES ($1, $2, 'active', now())`,
        [input.organisationId, input.planType],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** FR-SUB-006: payment confirmation email — informational, sent via the background job queue (AD-010). */
export async function sendPaymentConfirmationEmail(input: {
  email: string;
  planType: 'monthly' | 'yearly';
  amountCents: number;
}): Promise<void> {
  const amount = (input.amountCents / 100).toFixed(2);
  await enqueueEmailJob({
    to: input.email,
    subject: 'TestFlow — Payment confirmed',
    body: `Your ${input.planType} plan payment of $${amount} USD was successful.`,
  });
  await processPendingJobs();
}

export async function getBillingHistory(organisationId: string): Promise<{
  payments: Array<{ id: string; amount: string; planType: string; status: string; chargedAt: Date }>;
  seatBatches: Array<{ id: string; seatCount: number; planTypeAtPurchase: string; purchasedAt: Date; amountCharged: string }>;
}> {
  const payments = await pool.query(
    'SELECT id, amount, plan_type AS "planType", status, charged_at AS "chargedAt" FROM payments WHERE organisation_id = $1 ORDER BY charged_at DESC',
    [organisationId],
  );
  const seatBatches = await pool.query(
    'SELECT id, seat_count AS "seatCount", plan_type_at_purchase AS "planTypeAtPurchase", purchased_at AS "purchasedAt", amount_charged AS "amountCharged" FROM seat_batches WHERE organisation_id = $1 ORDER BY purchased_at DESC',
    [organisationId],
  );
  return { payments: payments.rows, seatBatches: seatBatches.rows };
}
