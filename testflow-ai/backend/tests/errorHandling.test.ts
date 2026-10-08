import './paystackMock.js';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from './testUtils.js';

/**
 * TD-008: an unreadable request body is a client error (the approved "malformed/invalid request body"
 * response, 422 validation_error in the shared envelope) — never a 500.
 */
describe('unreadable request bodies are client errors, not 500s (TD-008)', () => {
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

  it('malformed JSON on a public endpoint -> 422 validation_error', async () => {
    const res = await request(app).post('/v1/auth/login').set('Content-Type', 'application/json').send('{bad json');

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: 'validation_error', message: 'The request body is not valid JSON.' });
  });

  it('malformed JSON on an authenticated endpoint is also 422 (the body is parsed before auth)', async () => {
    const res = await request(app)
      .post('/v1/organisations/00000000-0000-0000-0000-000000000000/projects')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('validation_error');
  });

  it('a body over the size limit -> 422 validation_error saying it is too large', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@example.com', password: 'x'.repeat(200_000) }));

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: 'validation_error', message: 'The request body is too large.' });
  });

  it('does not leak parser internals or a stack trace', async () => {
    const res = await request(app).post('/v1/auth/login').set('Content-Type', 'application/json').send('{bad');

    expect(JSON.stringify(res.body)).not.toMatch(/SyntaxError|Unexpected token|at \w+|body-parser/i);
  });

  it('valid JSON still works as before (unknown credentials -> 401, not 422)', async () => {
    const res = await request(app).post('/v1/auth/login').send({ email: 'nobody@example.com', password: 'wrong-password-123' });

    expect(res.status).toBe(401);
  });
});
