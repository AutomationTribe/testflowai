import 'dotenv/config';

/**
 * Central, explicit environment loader (Slice 0 foundation).
 * Fails fast on startup if a required variable is missing — no silent defaults for
 * anything security-relevant (NFR-SEC-003-adjacent: no accidental fallback secrets).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '4000')),
  databaseUrl: required('DATABASE_URL'),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:3000'),
  // Paystack (AD-028 — Slice 1; supersedes Stripe/AD-027, which doesn't support
  // payouts to Nigeria-based merchants). Optional with an obviously-fake placeholder
  // so signup/login/trial and the full test suite (which mocks lib/paystack.ts) work
  // without real credentials; real monthly/yearly payment testing requires an actual
  // Paystack *test-mode* secret key from https://dashboard.paystack.com/#/settings/developer.
  paystackSecretKey: optional('PAYSTACK_SECRET_KEY', 'sk_test_placeholder_not_a_real_key'),
  // E2E test-only flag (Slice 1 E2E closure). When true, the payment provider call
  // is bypassed with a deterministic fake outcome instead of a real Paystack network
  // call — never real payment credentials (see lib/paystack.ts, modules/testSupport).
  // Defaults false; also hard-gated behind `!isProduction` wherever it's read.
  e2eFakePayments: optional('E2E_FAKE_PAYMENTS', 'false') === 'true',
  // Resend (AD-029). Optional with an obviously-fake placeholder so signup/login/
  // trial and the full test suite (which never sends real email — see lib/email.ts)
  // work without real credentials; real email delivery requires an actual Resend
  // API key from https://resend.com/api-keys.
  resendApiKey: optional('RESEND_API_KEY', 're_placeholder_not_a_real_key'),
  emailFromAddress: optional('EMAIL_FROM_ADDRESS', 'TestFlow <onboarding@resend.dev>'),
} as const;

export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';
