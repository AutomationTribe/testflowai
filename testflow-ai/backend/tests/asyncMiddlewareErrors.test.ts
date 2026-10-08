import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

// The session and subscription lookups hit the database; make them fail the way a DB outage would.
vi.mock('../src/lib/session.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/session.js')>();
  return { ...actual, resolveSession: vi.fn().mockRejectedValue(new Error('database is down')) };
});
vi.mock('../src/modules/subscription/subscription.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/modules/subscription/subscription.service.js')>();
  return { ...actual, resolveSubscriptionAccess: vi.fn().mockRejectedValue(new Error('database is down')) };
});

import { requireAuth } from '../src/middleware/auth.js';
import { requireActiveSubscription } from '../src/middleware/subscriptionGate.js';
import { SESSION_COOKIE_NAME } from '../src/lib/session.js';

/**
 * TD-010: Express 4 does not catch a rejected promise from async middleware, so a database error
 * inside the auth/subscription gates used to leave the request hanging and raise an unhandled
 * rejection. They must hand the failure to next() so the central error handler answers (500, shared envelope).
 */
describe('async middleware passes failures to next() instead of rejecting (TD-010)', () => {
  it('requireAuth: a failing session lookup is forwarded to next(error), and the call itself does not reject', async () => {
    const req = { headers: { cookie: `${SESSION_COOKIE_NAME}=sometoken` } } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;

    await expect(requireAuth(req, {} as Response, next)).resolves.toBeUndefined();

    expect(next).toHaveBeenCalledTimes(1);
    const forwarded = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(forwarded).toBeInstanceOf(Error);
    expect((forwarded as Error).message).toBe('database is down');
  });

  it('requireActiveSubscription: a failing subscription lookup is forwarded to next(error), and the call does not reject', async () => {
    const req = { currentUser: { organisationId: 'org-1' } } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;

    await expect(requireActiveSubscription(req, {} as Response, next)).resolves.toBeUndefined();

    expect(next).toHaveBeenCalledTimes(1);
    expect(((next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as Error).message).toBe('database is down');
  });

  it('requireAuth still answers 401 (not an error) when there is no session cookie', async () => {
    const req = { headers: {} } as unknown as Request;
    const next = vi.fn() as unknown as NextFunction;

    await requireAuth(req, {} as Response, next);

    const forwarded = (next as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as { status?: number };
    expect(forwarded.status).toBe(401);
  });
});
