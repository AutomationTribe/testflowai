import { env } from '../config/env.js';

/**
 * Resend integration (AD-029). Plain `fetch()` against Resend's REST API — no SDK
 * dependency needed, mirroring `lib/paystack.ts`'s provider-boundary pattern.
 */
const RESEND_API_BASE = 'https://api.resend.com';

export interface SendResendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export async function sendViaResend(input: SendResendEmailInput): Promise<void> {
  const response = await fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFromAddress,
      to: [input.to],
      subject: input.subject,
      text: input.body,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${payload}`);
  }
}
