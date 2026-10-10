import { createHmac } from 'node:crypto';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';
import * as jobs from '../src/lib/jobs.js';
import { logger } from '../src/lib/logger.js';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, startTestServer, teardownTestDatabase, testSignup, type TestServer } from './testUtils.js';

/**
 * TD-015: how the backend answers VALIDLY SIGNED Paystack webhooks. Signatures here are real HMAC-SHA512 values
 * (the Paystack module is NOT mocked). Rule: acknowledge (200) anything that can never succeed on retry
 * (unknown event types, charges TestFlow did not create, malformed metadata, duplicates) and log it for
 * reconciliation; answer 500 only for genuine processing failures, so Paystack retries those.
 */
const app = createApp();
let server: TestServer;
let baseUrl = '';

function sign(body: string): string {
  return createHmac('sha512', env.paystackSecretKey).update(body).digest('hex');
}

async function deliver(event: unknown, overrides: { signature?: string } = {}) {
  const body = typeof event === 'string' ? event : JSON.stringify(event);
  return request(baseUrl)
    .post('/v1/webhooks/payments')
    .set('Content-Type', 'application/json')
    .set('x-paystack-signature', overrides.signature ?? sign(body))
    .send(body);
}

async function signUp(): Promise<string> {
  const res = await request(baseUrl).post('/v1/auth/signup').send(testSignup);
  const me = await request(baseUrl).get('/v1/me').set('Cookie', res.headers['set-cookie']![0]!);
  return me.body.organisation.id as string;
}

async function counts(): Promise<{ payments: number; seatBatches: number; markers: number }> {
  const r = await pool.query<{ payments: string; seat_batches: string; markers: string }>(
    `SELECT (SELECT count(*) FROM payments) AS payments, (SELECT count(*) FROM seat_batches) AS seat_batches,
            (SELECT count(*) FROM processed_payment_events) AS markers`,
  );
  return { payments: Number(r.rows[0]!.payments), seatBatches: Number(r.rows[0]!.seat_batches), markers: Number(r.rows[0]!.markers) };
}

function chargeSuccess(reference: string, metadata: Record<string, unknown> | undefined) {
  return { event: 'charge.success', data: { reference, amount: 7000000, ...(metadata ? { metadata } : {}) } };
}

describe('Paystack webhook handling (TD-015)', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    server = await startTestServer(app);
    baseUrl = server.baseUrl;
  });
  beforeEach(() => {
    vi.spyOn(logger, 'info');
    vi.spyOn(logger, 'warn');
    vi.spyOn(logger, 'error');
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await resetTestDatabase();
  });
  afterAll(async () => {
    await server.close();
    await teardownTestDatabase();
  });

  describe('signature', () => {
    it('rejects a missing, wrong, truncated or non-hex signature with 400 and no side effects', async () => {
      const organisationId = await signUp();
      const event = chargeSuccess('ref_sig', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });
      for (const signature of ['', 'abc', 'z'.repeat(128), sign('{}'), `${sign(JSON.stringify(event))}00`]) {
        const res = await deliver(event, { signature });
        expect(res.status, signature.slice(0, 12)).toBe(400);
      }
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
    });

    it('accepts the correct signature in upper or lower case hex', async () => {
      const organisationId = await signUp();
      const event = chargeSuccess('ref_case', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });
      expect((await deliver(event, { signature: sign(JSON.stringify(event)).toUpperCase() })).status).toBe(200);
    });
  });

  describe('events that can never succeed on retry are acknowledged and logged (no more 500 retry loops)', () => {
    it('charge.success without TestFlow metadata (a charge TestFlow did not create) -> 200 ignored, nothing written, logged for reconciliation', async () => {
      await signUp();
      const res = await deliver(chargeSuccess('T914717223362770', undefined));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ received: true, ignored: true });
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
      expect(logger.warn).toHaveBeenCalledWith('webhook_unattributable', expect.objectContaining({ event: 'charge.success', reference: 'T914717223362770' }));
      // a Paystack retry of the same event is answered the same way (never 500)
      expect((await deliver(chargeSuccess('T914717223362770', undefined))).status).toBe(200);
    });

    it.each([
      ['an unknown organisation id (valid UUID)', { organisationId: '00000000-0000-4000-8000-000000000000', planType: 'monthly', seatCount: '5', usdAmountCents: '5000' }],
      ['a malformed organisation id', { organisationId: 'not-a-uuid', planType: 'monthly', seatCount: '5', usdAmountCents: '5000' }],
      ['an unknown plan type', { organisationId: 'ORG', planType: 'enterprise', seatCount: '5', usdAmountCents: '5000' }],
      ['a zero seat count', { organisationId: 'ORG', planType: 'monthly', seatCount: '0', usdAmountCents: '5000' }],
      ['a negative seat count', { organisationId: 'ORG', planType: 'monthly', seatCount: '-3', usdAmountCents: '5000' }],
      ['a fractional seat count', { organisationId: 'ORG', planType: 'monthly', seatCount: '2.5', usdAmountCents: '5000' }],
      ['a non-numeric amount', { organisationId: 'ORG', planType: 'monthly', seatCount: '5', usdAmountCents: 'free' }],
      ['a zero amount', { organisationId: 'ORG', planType: 'monthly', seatCount: '5', usdAmountCents: '0' }],
      ['a negative amount', { organisationId: 'ORG', planType: 'monthly', seatCount: '5', usdAmountCents: '-100' }],
      ['an absurdly large amount', { organisationId: 'ORG', planType: 'monthly', seatCount: '5', usdAmountCents: '99999999999999999999' }],
      ['an amount one cent above what numeric(10,2) can hold', { organisationId: 'ORG', planType: 'monthly', seatCount: '5', usdAmountCents: '10000000000' }],
      ['a 12-digit amount the column cannot store', { organisationId: 'ORG', planType: 'monthly', seatCount: '5', usdAmountCents: '999999999999' }],
      ['one seat above the per-purchase cap', { organisationId: 'ORG', planType: 'monthly', seatCount: '1001', usdAmountCents: '5000' }],
      ['a seat count above the 32-bit integer column', { organisationId: 'ORG', planType: 'monthly', seatCount: '2147483648', usdAmountCents: '5000' }],
      ['a 12-digit seat count', { organisationId: 'ORG', planType: 'monthly', seatCount: '999999999999', usdAmountCents: '5000' }],
    ])('charge.success with %s -> 200 ignored, nothing written', async (_label, metadata) => {
      const organisationId = await signUp();
      const meta = { ...metadata, organisationId: metadata.organisationId === 'ORG' ? organisationId : metadata.organisationId };
      const res = await deliver(chargeSuccess('ref_bad', meta));
      expect(res.status).toBe(200);
      expect(res.body.ignored).toBe(true);
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
    });

    it.each([
      ['a NUL byte', 'a\u0000b'],
      ['a newline and forged JSON log text', 'x\n{"level":"error","message":"FORGED"}'],
      ['101 characters', 'r'.repeat(101)],
      ['spaces', 'ref with spaces'],
      ['non-ASCII characters', 'référence'],
      ['a lone surrogate', 'x\ud800'],
    ])('charge.success with a reference containing %s -> 200 ignored (it could never be stored)', async (_label, reference) => {
      const organisationId = await signUp();
      const res = await deliver(chargeSuccess(reference, { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' }));
      expect(res.status).toBe(200);
      expect(res.body.ignored).toBe(true);
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
    });

    it('the largest values the product and the database allow are still processed (the new bounds are not too tight)', async () => {
      const organisationId = await signUp();
      const res = await deliver(chargeSuccess('R'.repeat(100), { organisationId, planType: 'yearly', seatCount: '1000', usdAmountCents: '9999999999' }));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 });
    });

    it('charge.failed logs only short string fields from untrusted metadata', async () => {
      await deliver({ event: 'charge.failed', data: { reference: 'ref_fx', metadata: { organisationId: { huge: 'x'.repeat(5000) }, planType: 'p'.repeat(500) } } });
      const call = vi.mocked(logger.error).mock.calls.find(([m]) => m === 'payment_failed');
      expect(call).toBeDefined();
      const fields = call![1] as { organisationId?: unknown; planType?: string };
      expect(fields.organisationId).toBeUndefined();
      expect(fields.planType).toHaveLength(64);
    });

    it('charge.success with no reference -> 200 ignored (it cannot be made idempotent)', async () => {
      const organisationId = await signUp();
      const res = await deliver({ event: 'charge.success', data: { metadata: { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' } } });
      expect(res.status).toBe(200);
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
    });

    it.each([
      ['an event type TestFlow does not handle, without any reference', { event: 'subscription.create', data: { subscription_code: 'SUB_x' } }],
      ['an event type TestFlow does not handle, with a reference', { event: 'transfer.success', data: { reference: 'trf_1' } }],
      ['a signed event with no data at all', { event: 'customeridentification.success' }],
      ['a signed event whose data is not an object', { event: 'charge.dispute.create', data: 'x' }],
    ])('%s -> 200 ignored, the server keeps running', async (_label, event) => {
      const res = await deliver(event);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ received: true, ignored: true });
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
      expect((await request(baseUrl).get('/health')).status).toBe(200); // the process survived
    });

    it('charge.failed without metadata -> 200 and logged (previously a TypeError and a 500)', async () => {
      const res = await deliver({ event: 'charge.failed', data: { reference: 'ref_f1' } });
      expect(res.status).toBe(200);
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 });
    });

    it('a validly signed body that is not JSON, or has no event name, -> 400', async () => {
      expect((await deliver('this is not json')).status).toBe(400);
      expect((await deliver({ data: { reference: 'x' } })).status).toBe(400);
      expect((await deliver('null')).status).toBe(400);
    });
  });

  describe('successful charges: exactly-once processing', () => {
    it('records the payment, seat batch and subscription once, answers 200, and logs the outcome for reconciliation', async () => {
      const organisationId = await signUp();
      const res = await deliver(chargeSuccess('ref_ok', { organisationId, planType: 'yearly', seatCount: '5', usdAmountCents: '5000' }));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 });
      const sub = await pool.query('SELECT plan_type, status FROM subscriptions WHERE organisation_id = $1', [organisationId]);
      expect(sub.rows[0]).toMatchObject({ plan_type: 'yearly', status: 'active' });
      expect(logger.info).toHaveBeenCalledWith('webhook_processed', expect.objectContaining({ reference: 'ref_ok', organisationId, planType: 'yearly' }));
    });

    it('a redelivery (Paystack retry) is acknowledged as a duplicate and changes nothing', async () => {
      const organisationId = await signUp();
      const event = chargeSuccess('ref_dup', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });
      expect((await deliver(event)).status).toBe(200);
      const replay = await deliver(event);
      expect(replay.status).toBe(200);
      expect(replay.body).toMatchObject({ received: true, duplicate: true });
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 });
      expect(logger.info).toHaveBeenCalledWith('webhook_duplicate', expect.objectContaining({ reference: 'ref_dup' }));
    });

    it('five simultaneous deliveries of the same event record exactly one payment', async () => {
      const organisationId = await signUp();
      const event = chargeSuccess('ref_race', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });
      const results = await Promise.all(Array.from({ length: 5 }, () => deliver(event)));
      expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
      expect(results.filter((r) => r.body.duplicate).length).toBe(4);
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 });
    });

    it('a failure in the confirmation e-mail AFTER the payment committed does not make Paystack retry into a double payment', async () => {
      const organisationId = await signUp();
      vi.spyOn(jobs, 'enqueueEmailJob').mockRejectedValue(new Error('queue unavailable'));
      const event = chargeSuccess('ref_mail', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });

      const first = await deliver(event);
      expect(first.status).toBe(200); // the payment IS recorded; the e-mail is best effort
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 });
      expect(logger.error).toHaveBeenCalledWith('webhook_email_failed', expect.objectContaining({ reference: 'ref_mail' }));

      const retry = await deliver(event);
      expect(retry.body.duplicate).toBe(true);
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 }); // still one
    });
  });

  describe('genuine processing failures stay retryable (500) and leave no half-written state', () => {
    it('a database failure while recording the payment -> 500, nothing committed, and the retry then succeeds exactly once', async () => {
      const organisationId = await signUp();
      const event = chargeSuccess('ref_tx', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });

      const realConnect = pool.connect.bind(pool) as () => Promise<import('pg').PoolClient>;
      vi.spyOn(pool, 'connect').mockImplementationOnce((async () => {
        const client = await realConnect();
        const realQuery = client.query.bind(client) as (...args: unknown[]) => Promise<unknown>;
        let failed = false;
        (client as unknown as { query: (...args: unknown[]) => Promise<unknown> }).query = async (...args: unknown[]) => {
          if (!failed && typeof args[0] === 'string' && args[0].includes('INSERT INTO payments')) {
            failed = true;
            throw new Error('simulated database failure');
          }
          return realQuery(...args);
        };
        return client;
      }) as never);

      const failedAttempt = await deliver(event);
      expect(failedAttempt.status).toBe(500);
      expect(await counts()).toEqual({ payments: 0, seatBatches: 0, markers: 0 }); // marker and seat batch rolled back together
      expect(logger.error).toHaveBeenCalledWith('webhook_processing_failed', expect.objectContaining({ reference: 'ref_tx' }));

      const retry = await deliver(event);
      expect(retry.status).toBe(200);
      expect(retry.body.duplicate).toBeUndefined();
      expect(await counts()).toEqual({ payments: 1, seatBatches: 1, markers: 1 });
    });

    it('never logs the signature, the request body or the customer e-mail address', async () => {
      const organisationId = await signUp();
      const event = chargeSuccess('ref_log', { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' });
      await deliver(event);
      // Only the webhook's own log lines (the e-mail library logs its recipient when it sends, which is a separate, pre-existing log).
      const webhookLogs = [...vi.mocked(logger.info).mock.calls, ...vi.mocked(logger.warn).mock.calls, ...vi.mocked(logger.error).mock.calls].filter(
        ([message]) => message.startsWith('webhook_') || message === 'payment_failed',
      );
      expect(webhookLogs.length).toBeGreaterThan(0);
      const logged = JSON.stringify(webhookLogs);
      expect(logged).not.toContain(sign(JSON.stringify(event)));
      expect(logged).not.toContain(testSignup.email);
      expect(logged).not.toContain('usdAmountCents');
    });
  });
});
