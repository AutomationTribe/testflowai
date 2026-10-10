# Security headers and CSRF — prioritised remediation plan

**Status:** PROPOSED (prepared by the `security` agent on 2026-10-09; read-only review; nothing implemented). Each change needs Product Owner
approval and the normal review gates. Verified by code reading and non-mutating requests (`curl -sI`, one forged-Origin preflight) against
staging; no login, no POST.

## Progress (updated 2026-10-10)
- Items 1-2 (Origin allow-list, backend headers, no-store): **done**, merged `9f7a910`, backend deployed to staging 2026-10-09 (APID-022).
- Items 3-4 (frontend baseline headers, CSP): **implemented, report-only**, on branch `security/frontend-headers-csp` (AD-031, `frontend-security-headers.md`); **not merged, not deployed**.
- Items 5-8: not started.

## Current state (verified)
- **Frontend** (`https://testflow-frontend.onrender.com`): no CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
  HSTS, COOP or CORP; sends `x-powered-by: Next.js`. `next.config.js` has only `reactStrictMode`.
- **Backend** (`https://testflow-backend-yhj7.onrender.com`): CORS allows only the configured frontend origin with credentials (never reflects
  the caller, no wildcard); no security headers; no `Cache-Control` on authenticated JSON; `x-powered-by` already disabled.
- **Session cookie:** `testflow_session`, httpOnly, `Secure`, `SameSite=None` in production (cross-site by necessity: two `onrender.com` origins).
- **CSRF:** no Origin/Referer check anywhere. Requests needing `Content-Type: application/json` or a custom header are protected today by the
  CORS preflight. Routes accepting an empty body are forgeable cross-site: `POST /v1/organisations/:orgId/subscription/trial` (verified),
  `POST /v1/auth/logout`, and (code reading) `POST .../qa-configuration/draft/publish`. See TD-011.

## Priorities
| # | Item | Priority | Effort | Decision record needed |
|---|---|---|---|---|
| 1 | Origin allow-list on non-GET `/v1` requests (shared `isAllowedOrigin()` with CORS; 403 `forbidden_origin` in the shared envelope; absent Origin allowed) | P0 | S-M | api-decisions.md, security.md, close TD-011, openapi.yaml |
| 2 | Backend headers set by hand (no new dependency): `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` on `/v1`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (short max-age first, no includeSubDomains/preload) | P0 | S | security.md |
| 3 | Frontend baseline headers via `next.config.js headers()`: nosniff, X-Frame-Options DENY, Referrer-Policy `strict-origin-when-cross-origin`, Permissions-Policy, HSTS, `COOP: same-origin-allow-popups`, `poweredByHeader: false` (no COEP/CORP: they would break the Paystack iframe) | P1 | S | security.md |
| 4 | Frontend CSP, `Report-Only` first, then enforce (needs `'unsafe-inline'` scripts for Next hydration; Paystack domains must be confirmed in a real test checkout; a report collector would be new infrastructure) | P1 | M | security.md |
| 5 | JSON content-type enforcement (415) on body-bearing POSTs; explicit CORS `allowedHeaders` and `maxAge` | P1 | S | api-decisions.md (minor) |
| 6 | Custom domain with a shared parent, then `SameSite=Lax` (impossible on `onrender.com`, a public suffix; also removes third-party-cookie blocking risk) | P2 | L | AD-006 amendment (product/cost decision) |
| 7 | Nonce-based strict CSP (middleware + dynamic rendering) | P2 | M-L | ADR |
| 8 | Double-submit token, WAF/CDN, CSP report collector | not recommended / P2 | L | ADR + rules 18/26 |

## Recommended first slice (one small reviewed backend-only change)
Items 1 and 2 together: shared `isAllowedOrigin()` used by `cors` and a new Origin-check middleware on the `v1` router (webhook mounted
separately and unaffected), a hand-written headers middleware (Swagger `/docs` exempt), unit tests including regression tests for a forged-Origin
`trial`, `draft/publish` and `logout` (these would have succeeded before), then the full backend and E2E suites, then a staging deploy and a
re-run of `curl -sI` against both URLs. Rollback: remove the `v1.use(...)` line and the headers middleware. Rollout order: 1+2, then 3, then 4
(report-only), then 5; P2 items are separate decisions.

## Compatibility notes
The Origin check rejects any browser client with a different Origin (future second client or mobile app); dev `localhost` keeps working through the
shared predicate. `Cache-Control: no-store` disables caching of API GETs (intended). The frontend CSP can break the Paystack popup silently, hence
report-only first and a manual test-key checkout. HSTS is sticky in browsers; start with a short max-age. Render/Cloudflare may add or strip headers:
re-curl after each deploy.

## Not verified
Exact Paystack Inline domains for CSP; whether `onrender.com` is on the Public Suffix List (believed yes); how Safari/Firefox/Chrome treat the
cross-site cookie today (possible functional failure for those users); the `qa-configuration/draft` POST body requirements; authenticated pages
(no login was performed); a full CSP violation sweep.
