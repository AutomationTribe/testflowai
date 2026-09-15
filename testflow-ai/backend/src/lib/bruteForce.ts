import { pool } from '../db/pool.js';

// NFR-SEC-001: protective response after 5 consecutive failed attempts within a short
// window. NFR-SEC-001 does not specify the exact window length — 15 minutes is an
// implementation default, same pattern as the session-TTL default in config/env.ts.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 1000 * 60 * 15;

export async function recordFailedLogin(email: string): Promise<void> {
  await pool.query('INSERT INTO login_attempts (email) VALUES ($1)', [email]);
}

export async function clearFailedLogins(email: string): Promise<void> {
  await pool.query('DELETE FROM login_attempts WHERE email = $1', [email]);
}

/** Returns true if this email is currently locked out due to too many recent failed attempts. */
export async function isLockedOut(email: string): Promise<boolean> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) FROM login_attempts WHERE email = $1 AND attempted_at > now() - interval '${WINDOW_MS / 1000} seconds'`,
    [email],
  );
  return Number(result.rows[0]?.count ?? 0) >= MAX_ATTEMPTS;
}
