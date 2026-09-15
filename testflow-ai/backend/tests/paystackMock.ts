import { vi } from 'vitest';

/**
 * Test double for the Paystack boundary (lib/paystack.ts). No real Paystack
 * test-mode credentials are available in this environment, so integration/unit
 * tests exercise TestFlow's own domain logic (amount calculation, webhook
 * reconciliation, idempotency, tenant isolation) against this mock rather than
 * the real network. Real Paystack test-mode keys would be needed to additionally
 * verify the actual Paystack wire protocol — see the Slice 1 final report's Known
 * Limitations.
 */
export const initializeTransactionMock = vi.fn(async (_input: { amountCents: number }) => ({
  reference: `ref_test_${Math.random().toString(36).slice(2)}`,
  accessCode: `access_test_${Math.random().toString(36).slice(2)}`,
}));

export const verifyPaystackSignatureMock = vi.fn((rawBody: Buffer, signature: string) => signature !== 'invalid-signature');

vi.mock('../src/lib/paystack.js', () => ({
  initializeTransaction: (input: { amountCents: number; email: string; organisationId: string; planType: string; seatCount: number }) =>
    initializeTransactionMock(input),
  verifyPaystackSignature: (rawBody: Buffer, signature: string) => verifyPaystackSignatureMock(rawBody, signature),
  parsePaystackEvent: (rawBody: Buffer) => JSON.parse(rawBody.toString('utf8')),
}));
