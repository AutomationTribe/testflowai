import './paystackMock.js';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { initializeTransactionMock, verifyPaystackSignatureMock } from './paystackMock.js';
import { clearSentEmails, sentEmails } from '../src/lib/email.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from './testUtils.js';

const app = createApp();

async function signUpAndGetCookie(overrides: Partial<Record<string, string>> = {}) {
  const payload = {
    email: 'admin@example.com',
    password: 'correct-horse-battery-staple',
    name: 'Ada Admin',
    role: 'admin',
    organisationName: 'Acme QA',
    ...overrides,
  };
  const res = await request(app).post('/v1/auth/signup').send(payload);
  const cookie = res.headers['set-cookie']![0]!;
  const me = await request(app).get('/v1/me').set('Cookie', cookie);
  return { cookie, organisationId: me.body.organisation.id as string, userId: me.body.user.id as string };
}

function chargeEvent(eventType: 'charge.success' | 'charge.failed', reference: string, data: Record<string, unknown>) {
  return { event: eventType, data: { reference, ...data } };
}

describe('subscription domain', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
    initializeTransactionMock.mockClear();
    verifyPaystackSignatureMock.mockClear();
    clearSentEmails();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('reports no access for a brand-new organisation with no subscription', async () => {
    const { cookie } = await signUpAndGetCookie();
    const me = await request(app).get('/v1/me').set('Cookie', cookie);
    expect(me.body.subscription).toMatchObject({ hasAccess: false, status: 'none', planType: null });

    const workspace = await request(app).get('/v1/workspace').set('Cookie', cookie);
    expect(workspace.status).toBe(403);
    expect(workspace.body.error).toBe('subscription_required');
  });

  it('activates a trial, grants access, and sends a confirmation email at signup', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    expect(sentEmails.some((e) => e.subject.includes('Welcome'))).toBe(true);

    const trial = await request(app).post(`/v1/organisations/${organisationId}/subscription/trial`).set('Cookie', cookie);
    expect(trial.status).toBe(201);
    expect(trial.body.subscription.planType).toBe('trial');

    const me = await request(app).get('/v1/me').set('Cookie', cookie);
    expect(me.body.subscription).toMatchObject({ hasAccess: true, status: 'trial_active', planType: 'trial', seatsTotal: 3 });

    const workspace = await request(app).get('/v1/workspace').set('Cookie', cookie);
    expect(workspace.status).toBe(200);
  });

  it('cannot activate a second trial for the same organisation', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    await request(app).post(`/v1/organisations/${organisationId}/subscription/trial`).set('Cookie', cookie);

    const second = await request(app).post(`/v1/organisations/${organisationId}/subscription/trial`).set('Cookie', cookie);
    expect(second.status).toBe(409);
  });

  it('replays the original response for a repeated trial Idempotency-Key instead of erroring', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const key = 'trial-key-1';

    const first = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/trial`)
      .set('Cookie', cookie)
      .set('Idempotency-Key', key);
    const replay = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/trial`)
      .set('Cookie', cookie)
      .set('Idempotency-Key', key);

    expect(first.status).toBe(201);
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);
  });

  it('rejects an invalid seat quantity for monthly subscribe', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const res = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/monthly`)
      .set('Cookie', cookie)
      .send({ seatCount: 0 });
    expect(res.status).toBe(422);

    const negative = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/monthly`)
      .set('Cookie', cookie)
      .send({ seatCount: -5 });
    expect(negative.status).toBe(422);
  });

  it('calculates monthly amount server-side and ignores a client-submitted total', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const res = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/monthly`)
      .set('Cookie', cookie)
      // attacker attempts to smuggle a manipulated price alongside the real field
      .send({ seatCount: 5, amountCents: 1 });

    expect(res.status).toBe(201);
    expect(res.body.amountCents).toBe(5000); // 5 x $10.00, never the attacker-supplied 1
    expect(initializeTransactionMock).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 5000, seatCount: 5, planType: 'monthly' }),
    );
  });

  it('calculates yearly amount server-side (5 seats x $9 x 12 = $540.00)', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const res = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/yearly`)
      .set('Cookie', cookie)
      .send({ seatCount: 5 });

    expect(res.status).toBe(201);
    expect(res.body.amountCents).toBe(54000);
  });

  it('protects against a repeated (double-clicked) monthly checkout submission — only one transaction is initialized', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const key = 'monthly-checkout-key-1';

    const first = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/monthly`)
      .set('Cookie', cookie)
      .set('Idempotency-Key', key)
      .send({ seatCount: 5 });
    const replay = await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/monthly`)
      .set('Cookie', cookie)
      .set('Idempotency-Key', key)
      .send({ seatCount: 5 });

    expect(first.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    expect(initializeTransactionMock).toHaveBeenCalledTimes(1);
  });

  it('grants no access and creates no billing records while payment is only client-initiated (not yet webhook-confirmed)', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    await request(app)
      .post(`/v1/organisations/${organisationId}/subscription/monthly`)
      .set('Cookie', cookie)
      .send({ seatCount: 5 });

    const me = await request(app).get('/v1/me').set('Cookie', cookie);
    expect(me.body.subscription.hasAccess).toBe(false);

    const billing = await request(app).get(`/v1/organisations/${organisationId}/billing-history`).set('Cookie', cookie);
    expect(billing.body.payments).toHaveLength(0);
  });

  it('activates subscription and seats only once Paystack confirms via webhook (NFR-REL-003)', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const event = chargeEvent('charge.success', 'ref_1', {
      amount: 7000000, // NGN kobo actually settled — never trusted for billing (see webhook.routes.ts)
      metadata: { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' },
    });

    const webhook = await request(app)
      .post('/v1/webhooks/payments')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'valid')
      .send(JSON.stringify(event));
    expect(webhook.status).toBe(200);

    const me = await request(app).get('/v1/me').set('Cookie', cookie);
    expect(me.body.subscription).toMatchObject({ hasAccess: true, status: 'active', planType: 'monthly', seatsTotal: 5 });

    const billing = await request(app).get(`/v1/organisations/${organisationId}/billing-history`).set('Cookie', cookie);
    expect(billing.body.payments).toHaveLength(1);
    expect(billing.body.payments[0]).toMatchObject({ status: 'succeeded', amount: '50.00' });
    expect(sentEmails.some((e) => e.subject.includes('Payment confirmed'))).toBe(true);
  });

  it('processes a duplicate (redelivered) webhook event exactly once — no double seat activation', async () => {
    const { organisationId } = await signUpAndGetCookie();
    const event = chargeEvent('charge.success', 'ref_2', {
      amount: 14000000,
      metadata: { organisationId, planType: 'monthly', seatCount: '10', usdAmountCents: '10000' },
    });

    const first = await request(app)
      .post('/v1/webhooks/payments')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'valid')
      .send(JSON.stringify(event));
    const replay = await request(app)
      .post('/v1/webhooks/payments')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'valid')
      .send(JSON.stringify(event));

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(replay.body.duplicate).toBe(true);
  });

  it('rejects a forged webhook (invalid signature) and performs no side effects', async () => {
    const { organisationId } = await signUpAndGetCookie();
    const event = chargeEvent('charge.success', 'ref_forged', {
      amount: 999999,
      metadata: { organisationId, planType: 'monthly', seatCount: '999', usdAmountCents: '999999' },
    });

    const res = await request(app)
      .post('/v1/webhooks/payments')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'invalid-signature')
      .send(JSON.stringify(event));

    expect(res.status).toBe(400);
  });

  it('failed payment grants no access and creates no billing record', async () => {
    const { cookie, organisationId } = await signUpAndGetCookie();
    const event = chargeEvent('charge.failed', 'ref_fail', {
      amount: 7000000,
      metadata: { organisationId, planType: 'monthly', seatCount: '5', usdAmountCents: '5000' },
    });

    const res = await request(app)
      .post('/v1/webhooks/payments')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', 'valid')
      .send(JSON.stringify(event));
    expect(res.status).toBe(200);

    const me = await request(app).get('/v1/me').set('Cookie', cookie);
    expect(me.body.subscription.hasAccess).toBe(false);
    const billing = await request(app).get(`/v1/organisations/${organisationId}/billing-history`).set('Cookie', cookie);
    expect(billing.body.payments).toHaveLength(0);
  });

  it('enforces tenant isolation: organisation A cannot read organisation B billing/subscription state', async () => {
    const orgA = await signUpAndGetCookie({ email: 'a@example.com', organisationName: 'Org A' });
    const orgB = await signUpAndGetCookie({ email: 'b@example.com', organisationName: 'Org B' });

    const crossRead = await request(app)
      .get(`/v1/organisations/${orgB.organisationId}/subscription`)
      .set('Cookie', orgA.cookie);
    expect(crossRead.status).toBe(404);

    const crossBilling = await request(app)
      .get(`/v1/organisations/${orgB.organisationId}/billing-history`)
      .set('Cookie', orgA.cookie);
    expect(crossBilling.status).toBe(404);

    const crossTrial = await request(app)
      .post(`/v1/organisations/${orgB.organisationId}/subscription/trial`)
      .set('Cookie', orgA.cookie);
    expect(crossTrial.status).toBe(404);
  });

  it('rejects subscription access with no session at all', async () => {
    const res = await request(app).get('/v1/organisations/00000000-0000-0000-0000-000000000000/subscription');
    expect(res.status).toBe(401);
  });
});
