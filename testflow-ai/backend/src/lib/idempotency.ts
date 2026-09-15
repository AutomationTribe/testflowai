import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

/**
 * APID-006: honors `Idempotency-Key` on subscription/seat-purchase actions. A repeated
 * key for the same organisation+endpoint replays the original response instead of
 * re-executing the action (prevents double-charging on a retried/double-clicked request).
 *
 * Returns true if a cached response was found and already sent (caller must return
 * immediately); false if the caller should proceed and then call `storeIdempotentResponse`.
 */
export async function replayIfSeen(req: Request, res: Response, organisationId: string, endpoint: string): Promise<boolean> {
  const key = req.header('Idempotency-Key');
  if (!key) return false;

  const result = await pool.query<{ response_status: number; response_body: unknown }>(
    'SELECT response_status, response_body FROM idempotency_keys WHERE organisation_id = $1 AND endpoint = $2 AND idempotency_key = $3',
    [organisationId, endpoint, key],
  );

  const row = result.rows[0];
  if (!row) return false;

  res.status(row.response_status).json(row.response_body);
  return true;
}

export async function storeIdempotentResponse(
  req: Request,
  organisationId: string,
  endpoint: string,
  status: number,
  body: unknown,
): Promise<void> {
  const key = req.header('Idempotency-Key');
  if (!key) return;

  await pool.query(
    `INSERT INTO idempotency_keys (organisation_id, endpoint, idempotency_key, response_status, response_body)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (organisation_id, endpoint, idempotency_key) DO NOTHING`,
    [organisationId, endpoint, key, status, JSON.stringify(body)],
  );
}
