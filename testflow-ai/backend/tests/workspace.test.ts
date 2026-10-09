import './paystackMock.js';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, startTestServer, type TestServer } from './testUtils.js';

/**
 * GET /workspace had zero test coverage before this file — it's the concrete,
 * server-enforced proof of the requireActiveSubscription gate (FR-SUB-002). Any
 * real business endpoint added in a later slice reuses that same gate, so proving
 * it here (401 unauthenticated, 403 no access, 200 with active trial) is the
 * regression backstop for every future gated route.
 */
describe('GET /workspace — requireActiveSubscription gate', () => {
  const app = createApp();
  let server: TestServer;
  let baseUrl = '';

  beforeAll(async () => {
    await setupTestDatabase();
    server = await startTestServer(app);
    baseUrl = server.baseUrl;
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await server.close();
    await teardownTestDatabase();
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(baseUrl).get('/v1/workspace');
    expect(res.status).toBe(401);
  });

  it('rejects an authenticated organisation with no trial/subscription (subscription_required)', async () => {
    const signup = await request(baseUrl).post('/v1/auth/signup').send({
      email: 'no-sub@example.com',
      password: 'correct-horse-battery-staple',
      name: 'No Sub',
      role: 'admin',
      organisationName: 'No Sub Org',
    });
    const cookie = signup.headers['set-cookie']![0]!;

    const res = await request(baseUrl).get('/v1/workspace').set('Cookie', cookie);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('subscription_required');
  });

  it('allows access once the organisation has activated its trial', async () => {
    const signup = await request(baseUrl).post('/v1/auth/signup').send({
      email: 'has-trial@example.com',
      password: 'correct-horse-battery-staple',
      name: 'Has Trial',
      role: 'admin',
      organisationName: 'Has Trial Org',
    });
    const cookie = signup.headers['set-cookie']![0]!;
    const me = await request(baseUrl).get('/v1/me').set('Cookie', cookie);
    const organisationId = me.body.organisation.id as string;

    await request(baseUrl).post(`/v1/organisations/${organisationId}/subscription/trial`).set('Cookie', cookie);

    const res = await request(baseUrl).get('/v1/workspace').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
