import { pool } from '../db/pool.js';
import { logger } from './logger.js';
import { sendEmail } from './email.js';

/**
 * AD-010: database-backed simple job queue, processed by a lightweight worker —
 * not a managed queue service. Slice 1 only has one job type (send an email), so
 * this stays intentionally small: enqueue writes a row, processJobs() drains
 * pending rows. The caller triggers a drain right after enqueueing (fire-and-forget)
 * so emails go out promptly in normal operation; a periodic drain (started in
 * index.ts) is the retry/catch-up path if that immediate attempt fails.
 */
interface EmailJobPayload {
  to: string;
  subject: string;
  body: string;
}

export async function enqueueEmailJob(payload: EmailJobPayload): Promise<void> {
  await pool.query("INSERT INTO jobs (type, payload) VALUES ('send_email', $1)", [
    JSON.stringify(payload),
  ]);
}

export async function processPendingJobs(): Promise<void> {
  const result = await pool.query<{ id: string; type: string; payload: EmailJobPayload; attempts: number }>(
    "SELECT id, type, payload, attempts FROM jobs WHERE status = 'pending' AND run_at <= now() ORDER BY created_at LIMIT 20",
  );

  for (const job of result.rows) {
    try {
      if (job.type === 'send_email') {
        await sendEmail(job.payload);
      }
      await pool.query("UPDATE jobs SET status = 'done' WHERE id = $1", [job.id]);
    } catch (error) {
      const attempts = job.attempts + 1;
      logger.error('job_failed', { jobId: job.id, type: job.type, attempts, message: (error as Error).message });
      // Simple bounded retry: try again shortly, give up after 3 attempts (marks 'failed',
      // not silently dropped — an operator/alert can inspect the jobs table).
      if (attempts >= 3) {
        await pool.query("UPDATE jobs SET status = 'failed', attempts = $2 WHERE id = $1", [job.id, attempts]);
      } else {
        await pool.query(
          "UPDATE jobs SET attempts = $2, run_at = now() + interval '1 minute' WHERE id = $1",
          [job.id, attempts],
        );
      }
    }
  }
}

let pollHandle: NodeJS.Timeout | undefined;

/** Starts the periodic drain loop (catch-up path). Call once at server boot. */
export function startJobWorker(intervalMs = 5000): void {
  if (pollHandle) return;
  pollHandle = setInterval(() => {
    processPendingJobs().catch((error) => logger.error('job_worker_error', { message: (error as Error).message }));
  }, intervalMs);
  pollHandle.unref?.();
}

export function stopJobWorker(): void {
  if (pollHandle) clearInterval(pollHandle);
  pollHandle = undefined;
}
