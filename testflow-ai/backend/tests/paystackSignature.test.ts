import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { parsePaystackEvent, verifyPaystackSignature } from '../src/lib/paystack.js';

/**
 * Unit coverage for the real lib/paystack.ts signature/parsing logic — the rest of
 * the suite (subscription.test.ts) exercises this module through paystackMock.ts's
 * test double instead, so the actual HMAC verification never runs there. This is
 * the one place that logic is proven directly, since it's the sole authenticity
 * check on the webhook that creates paid subscriptions (NFR-REL-003).
 */
describe('verifyPaystackSignature', () => {
  it('accepts a correctly computed HMAC-SHA512 signature of the exact raw body', () => {
    const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_1' } }));
    const signature = createHmac('sha512', env.paystackSecretKey).update(body).digest('hex');
    expect(verifyPaystackSignature(body, signature)).toBe(true);
  });

  it('rejects a signature computed with the wrong secret', () => {
    const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_1' } }));
    const signature = createHmac('sha512', 'wrong-secret').update(body).digest('hex');
    expect(verifyPaystackSignature(body, signature)).toBe(false);
  });

  it('rejects when the body is tampered with after signing (any byte change invalidates it)', () => {
    const originalBody = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_1', amount: 100 } }));
    const signature = createHmac('sha512', env.paystackSecretKey).update(originalBody).digest('hex');

    const tamperedBody = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_1', amount: 999999 } }));
    expect(verifyPaystackSignature(tamperedBody, signature)).toBe(false);
  });

  it('rejects an empty/garbage signature', () => {
    const body = Buffer.from('{}');
    expect(verifyPaystackSignature(body, '')).toBe(false);
    expect(verifyPaystackSignature(body, 'not-a-real-signature')).toBe(false);
  });
});

describe('verifyPaystackSignature (constant-time, never throws)', () => {
  const body = Buffer.from('{"event":"charge.success"}');
  const good = createHmac('sha512', env.paystackSecretKey).update(body).digest('hex');

  it('accepts the exact signature in either hex case', () => {
    expect(verifyPaystackSignature(body, good)).toBe(true);
    expect(verifyPaystackSignature(body, good.toUpperCase())).toBe(true);
  });

  it.each(['', 'abc', 'z'.repeat(128), `${'0'.repeat(127)}`, `${'0'.repeat(129)}`, ` ${'0'.repeat(128)}`])('rejects the malformed signature %j without throwing', (bad) => {
    expect(verifyPaystackSignature(body, bad)).toBe(false);
  });

  it('rejects a well-formed signature that differs in a single character', () => {
    const flipped = `${good.slice(0, -1)}${good.endsWith('0') ? '1' : '0'}`;
    expect(verifyPaystackSignature(body, flipped)).toBe(false);
  });
});

describe('parsePaystackEvent', () => {
  it('parses a well-formed raw JSON body', () => {
    const body = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: 'ref_1', amount: 100, metadata: {} } }));
    const event = parsePaystackEvent(body);
    expect(event.event).toBe('charge.success');
    expect((event.data as { reference: string }).reference).toBe('ref_1');
  });

  it('refuses a JSON body that is not an object with a string event name', () => {
    for (const raw of ['null', '42', '"x"', '[]', '{"data":{}}', '{"event":7}']) {
      expect(() => parsePaystackEvent(Buffer.from(raw)), raw).toThrow();
    }
  });

  it('throws on malformed JSON rather than silently returning a partial object', () => {
    const body = Buffer.from('{not valid json');
    expect(() => parsePaystackEvent(body)).toThrow();
  });
});
