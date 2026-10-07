import { Pool } from 'pg';
import { env } from '../config/env.js';

/**
 * Single shared PostgreSQL pool (AD-005). Plain `pg` + hand-written SQL migrations —
 * no ORM has been approved in architecture-decisions.md, so Slice 0 stays boring and
 * explicit rather than introducing a framework layer that hasn't been decided on.
 */
export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Fail a request that cannot get a connection instead of waiting forever (defence in
  // depth: a stuck pool would otherwise hang every route, including login).
  connectionTimeoutMillis: 10_000,
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}
