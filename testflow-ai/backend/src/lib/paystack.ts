import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Paystack integration (AD-028, replacing Stripe/AD-027 — Stripe does not support
 * payouts to Nigeria-based merchants). Plain `fetch()` against Paystack's REST API
 * — no SDK dependency needed. TestFlow's own code never touches raw card data
 * (NFR-SEC-012): amounts/metadata go to Paystack, Paystack returns a transaction
 * reference + access code, and the browser's Paystack Inline popup collects the
 * card directly with Paystack.
 */
const PAYSTACK_API_BASE = 'https://api.paystack.co';

/**
 * Fixed USD→NGN conversion rate used only for the Paystack charge amount.
 * TestFlow's approved pricing (FR-SUB-004/005) is USD-denominated and is what the
 * UI always shows/stores (see subscription.service.ts's `calculateAmountCents`) —
 * this constant exists solely because the merchant's current Paystack account can
 * only settle in NGN, not because pricing itself changed. Based on the CBN
 * official rate as of 2026-09-12 (~1329.21 NGN/USD; source: tradingeconomics.com),
 * rounded up for a small buffer against day-to-day FX movement. Requires manual
 * updates over time — there is no live FX feed wired in.
 */
const USD_TO_NGN_RATE = 1400;

export interface InitializeTransactionInput {
  amountCents: number;
  email: string;
  organisationId: string;
  planType: 'monthly' | 'yearly';
  seatCount: number;
}

export interface InitializeTransactionResult {
  reference: string;
  accessCode: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializeTransaction(input: InitializeTransactionInput): Promise<InitializeTransactionResult> {
  // Paystack is charged in NGN kobo; TestFlow's own ledger (billing history,
  // webhook reconciliation) stays in the original USD cents — see
  // `usdAmountCents` in metadata, which the webhook reads back instead of
  // trusting the NGN amount Paystack reports.
  const ngnKobo = Math.round(input.amountCents * USD_TO_NGN_RATE);

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: ngnKobo,
      currency: 'NGN',
      metadata: {
        organisationId: input.organisationId,
        planType: input.planType,
        seatCount: String(input.seatCount),
        usdAmountCents: String(input.amountCents),
      },
    }),
  });

  const payload = (await response.json()) as PaystackInitializeResponse;
  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(`Paystack transaction initialize failed: ${payload.message ?? response.statusText}`);
  }

  return { reference: payload.data.reference, accessCode: payload.data.access_code };
}

/**
 * Paystack signs webhook bodies with HMAC-SHA512 of the raw request body using the
 * same secret key used for API auth (unlike Stripe, there is no separate webhook
 * secret). Header: `x-paystack-signature`.
 */
export function verifyPaystackSignature(rawBody: Buffer, signature: string): boolean {
  // A SHA-512 HMAC is 128 hex characters. Anything else cannot be valid, and timingSafeEqual
  // throws on a length mismatch, so reject malformed values first. The comparison itself is
  // constant-time: the signature is the only thing authenticating this endpoint.
  if (!/^[0-9a-fA-F]{128}$/.test(signature)) return false;
  const expected = createHmac('sha512', env.paystackSecretKey).update(rawBody).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

/**
 * A Paystack webhook event as TestFlow sees it BEFORE any trust is placed in its shape. Only `event` is
 * guaranteed; `data` and everything inside it must be checked by the handler (events of other types, such
 * as subscription.* or transfer.*, have different or no `reference`/`metadata`).
 */
export interface PaystackWebhookEvent {
  event: string;
  data?: unknown;
}

/** Parses a (signature-verified) webhook body. Throws when it is not a JSON object with a string `event`. */
export function parsePaystackEvent(rawBody: Buffer): PaystackWebhookEvent {
  const parsed: unknown = JSON.parse(rawBody.toString('utf8'));
  if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { event?: unknown }).event !== 'string') {
    throw new Error('Not a Paystack event object.');
  }
  return parsed as PaystackWebhookEvent;
}
