import { createServer, type RequestListener } from 'node:http';
import type { AddressInfo } from 'node:net';
import { pool } from '../src/db/pool.js';
import { runMigrations } from '../src/db/migrate.js';
import { env } from '../src/config/env.js';
import { assertSafeTestDatabase } from './testDatabaseGuard.js';

/** Shared test setup: apply migrations once, then truncate between tests for isolation. */
export async function setupTestDatabase(): Promise<void> {
  assertSafeTestDatabase(env.databaseUrl);
  await runMigrations();
}

export async function resetTestDatabase(): Promise<void> {
  // Defence in depth: TRUNCATE ... CASCADE must never reach a non-test database.
  assertSafeTestDatabase(env.databaseUrl);
  await pool.query(
    `TRUNCATE TABLE
       project_memberships, projects,
       sessions, users, organisations,
       subscriptions, seat_batches, payments,
       login_attempts, idempotency_keys, processed_payment_events, jobs
     RESTART IDENTITY CASCADE`,
  );
}

/**
 * One long-lived HTTP server per test file (TD-007). `request(app)` starts and closes a server on a random
 * port for every call; that occasionally reaches a stale socket or an unrelated local listener and shows up
 * as an empty-body 404 or a missing cookie. Use `request(server.baseUrl)` instead.
 */
export interface TestServer {
  baseUrl: string;
  close(): Promise<void>;
}

export async function startTestServer(app: RequestListener): Promise<TestServer> {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export async function teardownTestDatabase(): Promise<void> {
  await pool.end();
}

export const testSignup = {
  email: 'admin@example.com',
  password: 'correct-horse-battery-staple',
  name: 'Ada Admin',
  role: 'admin' as const,
  organisationName: 'Acme QA',
};
