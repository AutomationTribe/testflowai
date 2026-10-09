import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, testSignup, startTestServer, type TestServer } from './testUtils.js';

describe('authentication', () => {
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

  it('signs up a new organisation + user and establishes a session', async () => {
    const response = await request(baseUrl).post('/v1/auth/signup').send(testSignup);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: testSignup.email, role: 'admin' });
    expect(response.headers['set-cookie']?.[0]).toMatch(/testflow_session=/);
  });

  it('rejects sign-up with a disallowed role', async () => {
    const response = await request(baseUrl)
      .post('/v1/auth/signup')
      .send({ ...testSignup, role: 'qa_tester' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('validation_error');
  });

  it('rejects sign-up with a password under 8 characters', async () => {
    const response = await request(baseUrl)
      .post('/v1/auth/signup')
      .send({ ...testSignup, password: 'short' });

    expect(response.status).toBe(422);
    expect(response.body.fields).toHaveProperty('password');
  });

  it('rejects sign-up missing required fields, reporting each missing field', async () => {
    const response = await request(baseUrl).post('/v1/auth/signup').send({});

    expect(response.status).toBe(422);
    expect(response.body.fields).toMatchObject({
      email: expect.any(String),
      password: expect.any(String),
      name: expect.any(String),
      role: expect.any(String),
      organisationName: expect.any(String),
    });
  });

  it('rejects sign-up with an email already in use (409, no duplicate account/organisation created)', async () => {
    await request(baseUrl).post('/v1/auth/signup').send(testSignup);

    const duplicate = await request(baseUrl)
      .post('/v1/auth/signup')
      .send({ ...testSignup, organisationName: 'A Different Org' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toBe('conflict');
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    await request(baseUrl).post('/v1/auth/signup').send(testSignup);

    const goodLogin = await request(baseUrl)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: testSignup.password });
    expect(goodLogin.status).toBe(200);
    expect(goodLogin.headers['set-cookie']?.[0]).toMatch(/testflow_session=/);

    const badLogin = await request(baseUrl)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: 'wrong-password' });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.error).toBe('unauthorized');
  });

  it('rejects login for an email that has never signed up, with the same generic message as a wrong password', async () => {
    const response = await request(baseUrl)
      .post('/v1/auth/login')
      .send({ email: 'never-signed-up@example.com', password: 'whatever12345' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password.');
  });

  it('rejects login missing email or password (validation, not treated as a credential mismatch)', async () => {
    const noPassword = await request(baseUrl).post('/v1/auth/login').send({ email: testSignup.email });
    expect(noPassword.status).toBe(422);

    const noEmail = await request(baseUrl).post('/v1/auth/login').send({ password: testSignup.password });
    expect(noEmail.status).toBe(422);
  });

  it('rejects a protected route with no session (unauthenticated)', async () => {
    const response = await request(baseUrl).get('/v1/me');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('unauthorized');
  });

  it('logs out and invalidates the session server-side', async () => {
    const signupResponse = await request(baseUrl).post('/v1/auth/signup').send(testSignup);
    const cookie = signupResponse.headers['set-cookie']![0]!;

    const logoutResponse = await request(baseUrl).post('/v1/auth/logout').set('Cookie', cookie);
    expect(logoutResponse.status).toBe(204);

    const afterLogout = await request(baseUrl).get('/v1/me').set('Cookie', cookie);
    expect(afterLogout.status).toBe(401);
  });
});
