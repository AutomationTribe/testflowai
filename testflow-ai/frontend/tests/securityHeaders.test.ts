import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, buildSecurityHeaders } from '../security-headers';

const API = 'https://testflow-backend-yhj7.onrender.com';

function directive(policy: string, name: string): string[] {
  const found = policy.split('; ').find((part) => part.startsWith(`${name} `));
  return found ? found.slice(name.length + 1).split(' ') : [];
}
function headerValue(headers: Array<{ key: string; value: string }>, key: string): string | undefined {
  return headers.find((h) => h.key === key)?.value;
}

describe('buildSecurityHeaders', () => {
  const prod = buildSecurityHeaders({ isDev: false, apiBaseUrl: API });

  it('sends the baseline headers on every route', () => {
    expect(headerValue(prod, 'X-Content-Type-Options')).toBe('nosniff');
    expect(headerValue(prod, 'X-Frame-Options')).toBe('DENY');
    expect(headerValue(prod, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerValue(prod, 'Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(headerValue(prod, 'Cross-Origin-Opener-Policy')).toBe('same-origin-allow-popups');
  });

  it('does not restrict the payment permission (Paystack iframe needs Apple/Google Pay delegation)', () => {
    expect(headerValue(prod, 'Permissions-Policy')).not.toContain('payment');
  });

  it('sends HSTS with a short max-age in production only', () => {
    expect(headerValue(prod, 'Strict-Transport-Security')).toBe('max-age=300');
    expect(headerValue(buildSecurityHeaders({ isDev: true, apiBaseUrl: API }), 'Strict-Transport-Security')).toBeUndefined();
  });

  it('introduces the CSP as REPORT-ONLY: the enforcing header must not be sent yet', () => {
    expect(headerValue(prod, 'Content-Security-Policy-Report-Only')).toBeTruthy();
    expect(headerValue(prod, 'Content-Security-Policy')).toBeUndefined();
  });

  it('never sets COEP or CORP, which would break the Paystack iframe and script', () => {
    const keys = prod.map((h) => h.key.toLowerCase());
    expect(keys).not.toContain('cross-origin-embedder-policy');
    expect(keys).not.toContain('cross-origin-resource-policy');
  });
});

describe('buildContentSecurityPolicy', () => {
  const prod = buildContentSecurityPolicy({ isDev: false, apiBaseUrl: API });
  const dev = buildContentSecurityPolicy({ isDev: true, apiBaseUrl: 'http://localhost:4100' });

  it('lets the browser reach the configured backend API, which is cross-origin (a miss would block every API call)', () => {
    expect(directive(prod, 'connect-src')).toContain(API);
    expect(directive(dev, 'connect-src')).toContain('http://localhost:4100');
  });

  it('reduces a full URL (path, trailing slash) to its origin', () => {
    const policy = buildContentSecurityPolicy({ isDev: false, apiBaseUrl: `${API}/v1/` });
    expect(directive(policy, 'connect-src')).toContain(API);
    expect(policy).not.toContain('/v1/');
  });

  it('survives an unusable API URL without emitting garbage', () => {
    const policy = buildContentSecurityPolicy({ isDev: false, apiBaseUrl: 'not a url' });
    expect(directive(policy, 'connect-src')).toEqual(["'self'", 'https://*.paystack.co', 'https://*.paystack.com']);
  });

  it("allows 'unsafe-eval' and websockets only in development", () => {
    expect(directive(prod, 'script-src')).not.toContain("'unsafe-eval'");
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'");
    expect(prod).not.toMatch(/ws:/);
    expect(prod).not.toMatch(/localhost/);
    expect(dev).toMatch(/ws:\/\/localhost:\*/);
  });

  it('allows the Paystack inline script, popup frame and API, and nothing else third-party', () => {
    expect(directive(prod, 'script-src')).toContain('https://js.paystack.co');
    expect(directive(prod, 'frame-src')).toEqual(['https://*.paystack.co', 'https://*.paystack.com']);
    const hosts = prod.match(/https:\/\/[^\s;]+/g) ?? [];
    const thirdParty = hosts.filter((h) => !/paystack\.(co|com)$/.test(h) && h !== API);
    expect(thirdParty).toEqual([]);
  });

  it('forbids framing, plugins, base-tag and form-target hijacking', () => {
    expect(directive(prod, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(prod, 'object-src')).toEqual(["'none'"]);
    expect(directive(prod, 'base-uri')).toEqual(["'self'"]);
    expect(directive(prod, 'form-action')).toEqual(["'self'"]);
    expect(directive(prod, 'default-src')).toEqual(["'self'"]);
  });

  it('has no wildcard source in default-src or script-src (the wildcards are scoped to paystack hosts)', () => {
    expect(directive(prod, 'script-src').join(' ')).not.toContain('*');
    expect(directive(prod, 'default-src').join(' ')).not.toContain('*');
  });
});
