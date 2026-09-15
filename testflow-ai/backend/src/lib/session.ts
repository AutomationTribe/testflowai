import { randomBytes } from 'node:crypto';
import { pool } from '../db/pool.js';

// NFR-SEC-002: sessions terminate after exactly 30 minutes of inactivity (sliding window),
// not a fixed absolute lifetime. Supersedes Slice 0's placeholder fixed 7-day TTL.
export const SESSION_INACTIVITY_TIMEOUT_MS = 1000 * 60 * 30;
export const SESSION_COOKIE_NAME = 'testflow_session';

export interface SessionUser {
  id: string;
  organisationId: string;
  email: string;
  name: string;
  role: 'admin' | 'qa_manager' | 'qa_tester';
}

/** Opaque, high-entropy session token — not a JWT, nothing decodable client-side. */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_INACTIVITY_TIMEOUT_MS);
  await pool.query('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [
    token,
    userId,
    expiresAt,
  ]);
  return { token, expiresAt };
}

/**
 * Resolves a session token to the authenticated user, server-side, and slides the
 * inactivity window forward on every successful use (NFR-SEC-002).
 * Returns null for a missing, expired, or otherwise invalid token — callers must
 * never distinguish these cases to the client (avoids leaking which failed).
 */
export async function resolveSession(token: string): Promise<SessionUser | null> {
  const result = await pool.query<{
    id: string;
    organisation_id: string;
    email: string;
    name: string;
    role: SessionUser['role'];
  }>(
    `SELECT u.id, u.organisation_id, u.email, u.name, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1
       AND s.expires_at > now()
       AND u.status = 'active'`,
    [token],
  );

  const row = result.rows[0];
  if (!row) return null;

  const newExpiresAt = new Date(Date.now() + SESSION_INACTIVITY_TIMEOUT_MS);
  await pool.query('UPDATE sessions SET expires_at = $1 WHERE token = $2', [newExpiresAt, token]);

  return {
    id: row.id,
    organisationId: row.organisation_id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

export async function destroySession(token: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
}
