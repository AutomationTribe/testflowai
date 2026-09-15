import { env, isTest } from '../config/env.js';
import { logger } from './logger.js';
import { sendViaResend } from './resend.js';

/**
 * Email-sending abstraction (Step 5 / AD-010's background-job pattern; real
 * delivery via Resend added in AD-029). A delivery failure is intentionally left
 * to propagate — `sendEmail` is only ever called from `jobs.ts`'s
 * `processPendingJobs()`, whose own try/catch is where AD-010 already handles
 * retry/failed-marking so an operator can inspect the `jobs` table. Swallowing
 * the error here instead would make every job report `status = 'done'` even when
 * the real send failed, hiding delivery failures entirely — informational-only
 * (FR-AUTH-004, FR-SUB-006) means a failure here must never block login or
 * subscription access, not that it should go unrecorded.
 */
export interface SentEmail {
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}

// Exported so tests can assert "signup confirmation triggered" without a real mail server.
export const sentEmails: SentEmail[] = [];

export async function sendEmail(input: { to: string; subject: string; body: string }): Promise<void> {
  const record: SentEmail = { ...input, sentAt: new Date() };
  sentEmails.push(record);
  logger.info('email_sent', { to: input.to, subject: input.subject });

  // Skipped under the test suite (Vitest sets NODE_ENV=test) so it never makes a
  // real network call or needs a real Resend API key. Also skipped under the
  // Playwright E2E suite (reuses `E2E_FAKE_PAYMENTS` as "this is a synthetic E2E
  // run", not just payments-specific) — E2E addresses are never real inboxes, so
  // a real Resend call there is only ever a guaranteed-failing network round trip.
  if (isTest || env.e2eFakePayments) return;

  await sendViaResend(input);
}

export function clearSentEmails(): void {
  sentEmails.length = 0;
}
