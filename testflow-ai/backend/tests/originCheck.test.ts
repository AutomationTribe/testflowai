import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, startTestServer, teardownTestDatabase, testSignup, type TestServer } from './testUtils.js';

/**
 * CSRF defence (TD-011): state-changing /v1 requests must come from a trusted Origin. These tests run the
 * real app against the real test database and assert on STATE, not just status codes — a forged request
 * must not have changed anything.
 */
const FRONTEND = 'http://localhost:3000'; // the default CORS_ORIGIN in tests
const EVIL = 'https://evil.example';

describe('Origin allow-list on state-changing /v1 requests', () => {
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

  async function signUp(): Promise<{ cookie: string; organisationId: string }> {
    const res = await request(baseUrl).post('/v1/auth/signup').send(testSignup);
    const cookie = res.headers['set-cookie']![0]!;
    const me = await request(baseUrl).get('/v1/me').set('Cookie', cookie);
    return { cookie, organisationId: me.body.organisation.id as string };
  }

  describe('forged cross-site requests (the CSRF cases that were exploitable before)', () => {
    it('a forged trial activation from an untrusted origin is refused and changes nothing', async () => {
      const { cookie, organisationId } = await signUp();

      const forged = await request(baseUrl)
        .post(`/v1/organisations/${organisationId}/subscription/trial`)
        .set('Cookie', cookie)
        .set('Origin', EVIL);

      expect(forged.status).toBe(403);
      expect(forged.body).toEqual({ error: 'forbidden_origin', message: 'This request came from an origin that is not allowed.' });
      const me = await request(baseUrl).get('/v1/me').set('Cookie', cookie);
      expect(me.body.subscription.hasAccess).toBe(false); // the trial was NOT started

      const genuine = await request(baseUrl)
        .post(`/v1/organisations/${organisationId}/subscription/trial`)
        .set('Cookie', cookie)
        .set('Origin', FRONTEND);
      expect(genuine.status).toBe(201); // same request from the real frontend works
    });

    it('a forged logout does not end the victim session', async () => {
      const { cookie } = await signUp();

      const forged = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Origin', EVIL);

      expect(forged.status).toBe(403);
      expect((await request(baseUrl).get('/v1/me').set('Cookie', cookie)).status).toBe(200); // still signed in
    });

    it('a forged QA-configuration publish with a form/text body (no preflight) is refused', async () => {
      const { cookie, organisationId } = await signUp();
      await request(baseUrl).post(`/v1/organisations/${organisationId}/subscription/trial`).set('Cookie', cookie);
      await request(baseUrl)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft`)
        .set('Cookie', cookie)
        .set('Origin', FRONTEND)
        .send({ presetOrigin: 'controlled' });

      const forged = await request(baseUrl)
        .post(`/v1/organisations/${organisationId}/qa-configuration/draft/publish`)
        .set('Cookie', cookie)
        .set('Origin', EVIL)
        .type('text/plain')
        .send('x');

      expect(forged.status).toBe(403);
      const current = await request(baseUrl).get(`/v1/organisations/${organisationId}/qa-configuration/current`).set('Cookie', cookie);
      expect(current.body.presetOrigin).toBe('standard'); // the open Controlled draft was NOT published
    });

    it('refuses the literal "null" origin (sandboxed iframes, file:, some redirects)', async () => {
      const { cookie } = await signUp();
      const res = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Origin', 'null');
      expect(res.status).toBe(403);
    });

    it.each(['PUT', 'PATCH', 'DELETE'] as const)('applies to %s as well, before the route is even looked up', async (method) => {
      const res = await request(baseUrl)[method.toLowerCase() as 'put']('/v1/anything').set('Origin', EVIL);
      expect(res.status).toBe(403); // not 404: the origin check runs first
    });

    it('refuses an untrusted origin even when the request is unauthenticated (login CSRF)', async () => {
      const res = await request(baseUrl).post('/v1/auth/login').set('Origin', EVIL).send({ email: testSignup.email, password: 'x' });
      expect(res.status).toBe(403);
    });

    it('refuses before the body is parsed (a malformed body from a foreign origin is 403, not 422)', async () => {
      const res = await request(baseUrl).post('/v1/auth/login').set('Origin', EVIL).set('Content-Type', 'application/json').send('{not json');
      expect(res.status).toBe(403);
    });
  });

  describe('requests WITHOUT an Origin header (explicit handling)', () => {
    it('are allowed when nothing marks them as browser cross-site traffic (server-to-server, curl, Playwright API context)', async () => {
      const { cookie } = await signUp(); // signup itself had no Origin and succeeded
      const res = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie);
      expect(res.status).toBeLessThan(400);
    });

    it('are refused when the browser says the request is cross-site (Sec-Fetch-Site: cross-site)', async () => {
      const { cookie } = await signUp();
      const res = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Sec-Fetch-Site', 'cross-site');
      expect(res.status).toBe(403);
      expect((await request(baseUrl).get('/v1/me').set('Cookie', cookie)).status).toBe(200);
    });

    it.each(['same-origin', 'same-site', 'none'])('are allowed with Sec-Fetch-Site: %s', async (value) => {
      const { cookie } = await signUp();
      const res = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Sec-Fetch-Site', value);
      expect(res.status).toBeLessThan(400);
    });

    it('are refused when the Referer is an untrusted site, and when it cannot be parsed', async () => {
      const { cookie } = await signUp();
      expect((await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Referer', `${EVIL}/page`)).status).toBe(403);
      expect((await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Referer', 'garbage')).status).toBe(403);
    });

    it('are allowed when the Referer is the trusted frontend', async () => {
      const { cookie } = await signUp();
      const res = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie).set('Referer', `${FRONTEND}/projects`);
      expect(res.status).toBeLessThan(400);
    });

    it('a request that still needs authentication gets no free pass: no Origin and no cookie is 401, not success', async () => {
      const res = await request(baseUrl).post('/v1/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  describe('valid frontend traffic and existing clients keep working', () => {
    it('the real frontend origin may sign up, log in and create data', async () => {
      const signup = await request(baseUrl).post('/v1/auth/signup').set('Origin', FRONTEND).send(testSignup);
      expect(signup.status).toBe(201);
      const login = await request(baseUrl).post('/v1/auth/login').set('Origin', FRONTEND).send({ email: testSignup.email, password: testSignup.password });
      expect(login.status).toBe(200);
    });

    it('another local dev port (as the Next dev server and the E2E suite use) is trusted outside production', async () => {
      const res = await request(baseUrl).post('/v1/auth/signup').set('Origin', 'http://localhost:3100').send(testSignup);
      expect(res.status).toBe(201);
    });

    it('safe methods are never blocked by the origin check (reads are protected by CORS)', async () => {
      const { cookie } = await signUp();
      const res = await request(baseUrl).get('/v1/me').set('Cookie', cookie).set('Origin', EVIL);
      expect(res.status).toBe(200);
    });

    it('the Paystack webhook (server-to-server, outside the /v1 origin check) is unaffected', async () => {
      const res = await request(baseUrl).post('/v1/webhooks/payments').set('Content-Type', 'application/json').send('{}');
      expect(res.status).not.toBe(403); // rejected (if at all) by its own signature check, not by the origin check
    });
  });

  describe('CORS uses the same predicate', () => {
    it('answers a preflight from the frontend with credentials allowed, and gives an untrusted origin no CORS headers', async () => {
      const ok = await request(baseUrl).options('/v1/auth/logout').set('Origin', FRONTEND).set('Access-Control-Request-Method', 'POST');
      expect(ok.headers['access-control-allow-origin']).toBe(FRONTEND);
      expect(ok.headers['access-control-allow-credentials']).toBe('true');

      const bad = await request(baseUrl).options('/v1/auth/logout').set('Origin', EVIL).set('Access-Control-Request-Method', 'POST');
      expect(bad.headers['access-control-allow-origin']).toBeUndefined();
      const nullOrigin = await request(baseUrl).options('/v1/auth/logout').set('Origin', 'null').set('Access-Control-Request-Method', 'POST');
      expect(nullOrigin.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
