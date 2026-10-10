'use strict';

/**
 * HTTP security headers for the Next.js frontend (docs/technical/frontend-security-headers.md, AD-031).
 * Kept as plain CommonJS so `next.config.js` can load it, and exported as pure functions so they can be unit tested.
 *
 * The Content-Security-Policy is REPORT-ONLY: it never blocks anything. Violations show up in the browser console and in
 * the `securitypolicyviolation` event (the E2E journey asserts there are none).
 */

const PAYSTACK = ['https://*.paystack.co', 'https://*.paystack.com'];
const PAYSTACK_SCRIPT = 'https://js.paystack.co';
const HSTS_MAX_AGE_SECONDS = 300; // deliberately short for the first release; HSTS is sticky in browsers

/** The origin ("scheme://host[:port]") of the backend API, or null when the URL is unusable. */
function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy({ isDev, apiBaseUrl }) {
  const apiOrigin = originOf(apiBaseUrl);
  const scriptSrc = ["'self'", "'unsafe-inline'", PAYSTACK_SCRIPT];
  const connectSrc = ["'self'", ...(apiOrigin ? [apiOrigin] : []), ...PAYSTACK];
  if (isDev) {
    scriptSrc.push("'unsafe-eval'"); // React refresh in `next dev`; never in production
    connectSrc.push('http://localhost:*', 'http://127.0.0.1:*', 'ws://localhost:*', 'ws://127.0.0.1:*'); // HMR websocket and local API
  }
  const directives = [
    ['default-src', ["'self'"]],
    ['script-src', scriptSrc],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', ...PAYSTACK]],
    ['font-src', ["'self'", 'data:']],
    ['connect-src', connectSrc],
    ['frame-src', PAYSTACK],
    ['frame-ancestors', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['object-src', ["'none'"]],
    ['manifest-src', ["'self'"]],
  ];
  return directives.map(([name, values]) => `${name} ${values.join(' ')}`).join('; ');
}

/** The header list for `next.config.js` `headers()`. */
function buildSecurityHeaders({ isDev, apiBaseUrl }) {
  const headers = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // `payment` is left at its default on purpose so Paystack's iframe keeps Apple Pay / Google Pay delegation.
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'Content-Security-Policy-Report-Only', value: buildContentSecurityPolicy({ isDev, apiBaseUrl }) },
  ];
  if (!isDev) headers.push({ key: 'Strict-Transport-Security', value: `max-age=${HSTS_MAX_AGE_SECONDS}` });
  return headers;
}

module.exports = { buildSecurityHeaders, buildContentSecurityPolicy };
