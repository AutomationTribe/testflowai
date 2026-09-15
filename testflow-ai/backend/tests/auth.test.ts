import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, testSignup } from './testUtils.js';

describe('authentication', () => {
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

  it('signs up a new organisation + user and establishes a session', async () => {
    const response = await request(app).post('/v1/auth/signup').send(testSignup);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: testSignup.email, role: 'admin' });
    expect(response.headers['set-cookie']?.[0]).toMatch(/testflow_session=/);
  });

  it('rejects sign-up with a disallowed role', async () => {
    const response = await request(app)
      .post('/v1/auth/signup')
      .send({ ...testSignup, role: 'qa_tester' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('validation_error');
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    await request(app).post('/v1/auth/signup').send(testSignup);

    const goodLogin = await request(app)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: testSignup.password });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.headers['set-cookie']?.[0]).toMatch(/testflow_session=/);

    const badLogin = await request(app)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: 'wrong-password' });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error).toBe('unauthorized');
  });

  it('rejects a protected route with no session (unauthenticated)', async () => {
    const response = await request(app).get('/v1/me');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  it('logs out and invalidates the session server-side', async () => {
    const signupResponse = await request(app).post('/v1/auth/signup').send(testSignup);
    const cookie = signupResponse.headers['set-cookie']![0]!;

    const logoutResponse = await request(app).post('/v1/auth/logout').set('Cookie', cookie);
    expect(logoutResponse.status).toBe(204);

    const afterLogout = await request(app).get('/v1/me').set('Cookie', cookie);
    expect(afterLogout.status).toBe(401);
  });
});
