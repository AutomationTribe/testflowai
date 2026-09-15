import { pool } from '../src/db/pool.js';
import { runMigrations } from '../src/db/migrate.js';

/** Shared test setup: apply migrations once, then truncate between tests for isolation. */
export async function setupTestDatabase(): Promise<void> {
  await runMigrations();
}

export async function resetTestDatabase(): Promise<void> {
  await pool.query(
    `TRUNCATE TABLE
       sessions, users, organisations,
       subscriptions, seat_batches, payments,
       login_attempts, idempotency_keys, processed_payment_events, jobs
     RESTART IDENTITY CASCADE`,
  );
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
