import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, testSignup } from './testUtils.js';

describe('GET /v1/me — tenant context resolution', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('resolves the authenticated user and their organisation from the session only', async () => {
    const signupResponse = await request(app).post('/v1/auth/signup').send(testSignup);
    const cookie = signupResponse.headers['set-cookie']![0]!;

    const response = await request(app).get('/v1/me').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: testSignup.email, role: 'admin' });
    expect(response.body.organisation).toMatchObject({ name: testSignup.organisationName });
    // Tenant context must be server-resolved: no organisationId is ever supplied by the client.
    expect(response.body.organisation.id).toEqual(expect.any(String));
  });

  it('rejects a request with an invalid/forged session cookie', async () => {
    const response = await request(app).get('/v1/me').set('Cookie', 'testflow_session=not-a-real-token');
    expect(response.status).toBe(401);
  });
});
