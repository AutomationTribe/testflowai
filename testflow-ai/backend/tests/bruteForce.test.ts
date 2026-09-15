import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase, testSignup } from './testUtils.js';

/** NFR-SEC-001: protective response after 5 consecutive failed login attempts. */
describe('login brute-force protection', () => {
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

  it('locks out after the 5th consecutive failed attempt, and a correct password no longer works until the window passes', async () => {
    await request(app).post('/v1/auth/signup').send(testSignup);

    for (let i = 0; i < 4; i += 1) {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ email: testSignup.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt still reports invalid credentials, but has now crossed the threshold.
    const fifth = await request(app)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: 'wrong-password' });
    expect(fifth.status).toBe(401);

    // Even the CORRECT password is now rejected — the lockout blocks the account, not just bad guesses.
    const lockedOut = await request(app)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: testSignup.password });
    expect(lockedOut.status).toBe(429);
    expect(lockedOut.body.error).toBe('rate_limited');
  });

  it('does not lock out an account with fewer than 5 failed attempts', async () => {
    await request(app).post('/v1/auth/signup').send(testSignup);

    for (let i = 0; i < 3; i += 1) {
      await request(app).post('/v1/auth/login').send({ email: testSignup.email, password: 'wrong-password' });
    }

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: testSignup.email, password: testSignup.password });
    expect(res.status).toBe(200);
  });

  it(
    'clears the failed-attempt counter after a successful login',
    async () => {
      await request(app).post('/v1/auth/signup').send(testSignup);

      for (let i = 0; i < 4; i += 1) {
        await request(app).post('/v1/auth/login').send({ email: testSignup.email, password: 'wrong-password' });
      }
      const success = await request(app)
        .post('/v1/auth/login')
        .send({ email: testSignup.email, password: testSignup.password });
      expect(success.status).toBe(200);

      // 4 more failures after a reset should still be under the threshold, not cumulative with the earlier 4.
      for (let i = 0; i < 4; i += 1) {
        await request(app).post('/v1/auth/login').send({ email: testSignup.email, password: 'wrong-password' });
      }
      const stillAllowed = await request(app)
        .post('/v1/auth/login')
        .send({ email: testSignup.email, password: testSignup.password });
      expect(stillAllowed.status).toBe(200);
    },
    // This test performs 11 sequential bcrypt hash/compare calls (deliberately expensive,
    // 12 rounds — lib/password.ts) — the vitest default 5s timeout is occasionally too
    // tight under CPU contention from other locally-running dev processes.
    15000,
  );
});
