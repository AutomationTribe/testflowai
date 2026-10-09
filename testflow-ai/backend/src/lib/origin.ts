import { env, isProduction } from '../config/env.js';

/**
 * Which browser origins may talk to this API with credentials. One predicate is shared by CORS
 * (what the browser may READ) and the CSRF Origin check (what may CHANGE state), so the two can
 * never drift apart.
 *
 * - Production: exactly the configured frontend origin (`CORS_ORIGIN`), nothing else.
 * - Development/test: also any http(s)://localhost:<port> or 127.0.0.1:<port> (Next's dev server
 *   silently moves to the next free port).
 * - The literal string "null" (sandboxed iframes, `file:`, some redirects) and every unparseable
 *   or look-alike value is never trusted.
 */
const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

function configuredOrigin(): string {
  // Browsers send lower-case scheme and host, so compare in lower case (a mixed-case CORS_ORIGIN would otherwise never match).
  return env.corsOrigin.replace(/\/+$/, '').toLowerCase();
}

/** True for an Origin header value that is a trusted frontend. Browsers send Origin without a path or trailing slash. */
export function isTrustedOrigin(origin: string): boolean {
  if (origin === configuredOrigin()) return true;
  return !isProduction && LOCAL_DEV_ORIGIN.test(origin);
}

/** The origin ("scheme://host[:port]") of a Referer URL, or null when it cannot be parsed. */
export function originOfUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin === 'null' ? null : parsed.origin;
  } catch {
    return null;
  }
}
