import { pool } from '../../db/pool.js';
import { HttpError } from '../../lib/httpError.js';
import { enqueueEmailJob, processPendingJobs } from '../../lib/jobs.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';

export interface AuthenticatedUser {
  id: string;
  organisationId: string;
  email: string;
  name: string;
  role: 'admin' | 'qa_manager' | 'qa_tester';
}

interface UserRow {
  id: string;
  organisation_id: string;
  email: string;
  name: string;
  role: AuthenticatedUser['role'];
  password_hash: string;
  status: 'active' | 'removed';
}

/**
 * FR-AUTH-001/004/005/006 + FR-ORG-001 (`auth.md` — Sign Up): creates the
 * organisation and its first user in one transaction, then enqueues the
 * confirmation email (FR-AUTH-004 — informational only, never an access gate;
 * see lib/jobs.ts / AD-010). The caller (auth.routes.ts) is responsible for the
 * post-sign-up subscription redirect (FR-AUTH-006), and FR-SUB-002's access gate
 * is enforced independently by middleware/subscriptionGate.ts on protected routes.
 */
export async function signUp(input: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'qa_manager';
  organisationName: string;
}): Promise<AuthenticatedUser> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [input.email]);
    if (existing.rows.length > 0) {
      throw HttpError.conflict('An account with this email already exists.');
    }

    const orgResult = await client.query<{ id: string }>(
      'INSERT INTO organisations (name) VALUES ($1) RETURNING id',
      [input.organisationName],
    );
    const organisationId = orgResult.rows[0]!.id;

    const passwordHash = await hashPassword(input.password);
    const userResult = await client.query<UserRow>(
      `INSERT INTO users (organisation_id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organisation_id, email, name, role, password_hash, status`,
      [organisationId, input.email, input.name, input.role, passwordHash],
    );

    await client.query('COMMIT');

    const user = toAuthenticatedUser(userResult.rows[0]!);
    await enqueueEmailJob({
      to: user.email,
      subject: 'Welcome to TestFlow',
      body: `Hi ${user.name}, your TestFlow account and organisation "${input.organisationName}" were created successfully.`,
    });
    await processPendingJobs();

    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** FR-AUTH-002 (`auth.md` — Log In). No detail disclosed on which field was wrong. */
export async function logIn(input: { email: string; password: string }): Promise<AuthenticatedUser> {
  const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [input.email]);
  const row = result.rows[0];

  if (!row) {
    throw HttpError.unauthorized('Invalid email or password.');
  }
  if (row.status === 'removed') {
    throw HttpError.forbidden('This account no longer has access.');
  }

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) {
    throw HttpError.unauthorized('Invalid email or password.');
  }

  return toAuthenticatedUser(row);
}

function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}
