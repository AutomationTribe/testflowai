import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { pool } from '../src/db/pool.js';

/**
 * Regression coverage for a real production bug fixed this project: sendEmail's
 * delivery failure was once silently swallowed by an inner try/catch, so every
 * email job was marked 'done' even when the real Resend send failed — hiding
 * delivery failures entirely (see lib/email.ts's doc comment on why the error is
 * left to propagate instead). These tests prove processPendingJobs' retry/failed-
 * marking behaviour actually engages when sendEmail throws, and only marks a job
 * 'done' when it genuinely succeeds.
 *
 * sendEmail is mocked (not the real one) so each test controls success/failure
 * directly, the same pattern paystackMock.ts uses for lib/paystack.ts.
 */
const sendEmailMock = vi.fn(async (_input: { to: string; subject: string; body: string }) => {});
vi.mock('../src/lib/email.js', () => ({
  sendEmail: (input: { to: string; subject: string; body: string }) => sendEmailMock(input),
}));

const { enqueueEmailJob, processPendingJobs } = await import('../src/lib/jobs.js');
const { setupTestDatabase, resetTestDatabase, teardownTestDatabase } = await import('./testUtils.js');

describe('processPendingJobs', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
    sendEmailMock.mockReset();
    sendEmailMock.mockImplementation(async () => {});
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function insertJobAndGetId(): Promise<string> {
    await enqueueEmailJob({ to: 'user@example.com', subject: 'Welcome', body: 'Hi' });
    const inserted = await pool.query<{ id: string }>("SELECT id FROM jobs WHERE type = 'send_email'");
    return inserted.rows[0]!.id;
  }

  async function getJob(id: string) {
    const result = await pool.query<{ status: string; attempts: number }>(
      'SELECT status, attempts FROM jobs WHERE id = $1',
      [id],
    );
    return result.rows[0]!;
  }

  it('marks a job done when send succeeds', async () => {
    const jobId = await insertJobAndGetId();

    await processPendingJobs();

    const job = await getJob(jobId);
    expect(job.status).toBe('done');
    expect(job.attempts).toBe(0);
  });

  it('a failed send is never silently marked done — it retries with attempts incremented and a future run_at', async () => {
    sendEmailMock.mockRejectedValueOnce(new Error('Resend send failed (403): simulated'));
    const jobId = await insertJobAndGetId();

    await processPendingJobs();

    const job = await getJob(jobId);
    expect(job.status).toBe('pending');
    expect(job.attempts).toBe(1);

    const row = await pool.query<{ run_at: string }>('SELECT run_at FROM jobs WHERE id = $1', [jobId]);
    expect(new Date(row.rows[0]!.run_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('marks a job failed (not silently dropped) after 3 failed attempts — an operator can inspect the jobs table', async () => {
    sendEmailMock.mockRejectedValue(new Error('Resend send failed (403): simulated'));
    const jobId = await insertJobAndGetId();

    // Each attempt sets run_at in the future, so directly force it back to make the
    // next drain pick the job up immediately instead of waiting a real minute.
    for (let i = 0; i < 3; i += 1) {
      await pool.query('UPDATE jobs SET run_at = now() WHERE id = $1', [jobId]);
      await processPendingJobs();
    }

    const job = await getJob(jobId);
    expect(job.status).toBe('failed');
    expect(job.attempts).toBe(3);
    expect(sendEmailMock).toHaveBeenCalledTimes(3);
  });
});
