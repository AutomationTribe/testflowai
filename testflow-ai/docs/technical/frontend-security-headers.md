# Frontend security headers and Content Security Policy (report-only first)

**Status:** IMPLEMENTED on branch `security/frontend-headers-csp` (not merged, not deployed). Approved by the Product Owner on 2026-10-09 as the next
security slice (items 3 and 4 of `security-remediation-plan.md`). **Risk class: MEDIUM** (touches every page; the CSP is report-only, so it cannot block anything).

## Requirement basis (nothing invented)
No functional or non-functional requirement mandates HTTP security headers or a CSP. This is approved security hardening that supports
NFR-SEC-007 (data in transit), NFR-SEC-010 (injection) and NFR-SEC-012 (card data goes straight to Paystack), and closes the frontend half of the
exposure recorded in `security-remediation-plan.md`. It adds no product behaviour, no API and no database change.

## Impact analysis
| Area | Impact |
|---|---|
| Database / migrations | none |
| API / backend | none (backend headers shipped in APID-022) |
| Web frontend | `next.config.js` sends headers on every route; new `frontend/security-headers.js` builds them |
| Security | adds clickjacking, MIME-sniffing, referrer, permissions, HSTS, COOP headers; CSP in **report-only** |
| Permissions / tenancy / authentication | none: cookies and the cross-origin API calls are unchanged |
| Tests | unit tests for the header builder; an E2E journey asserting the headers and **zero CSP violations** |
| Docs | this file, AD-031, `security.md`, `security-remediation-plan.md`, TD-014, status |

## Compatibility analysis
- **Next.js 15 (App Router, `next start`):** headers come from `headers()` in `next.config.js` and apply to prerendered pages and `/_next/static`. Next emits inline
  hydration scripts (`self.__next_f.push(...)`) and, without a nonce setup (middleware + dynamic rendering, a P2 item), the script policy needs `'unsafe-inline'`.
  Dev mode needs `'unsafe-eval'` (React refresh) and `ws://localhost:*` (HMR); production must not allow `eval`.
- **Styles:** 336 inline `style={{}}` uses and `next/font` output, so `style-src` needs `'unsafe-inline'`. Fonts are self-hosted at build time
  (`next/font/google` downloads Hanken Grotesk into `/_next/static/media`), so no Google font host is needed.
- **Paystack Inline v2:** `lib/paystackClient.ts` injects `https://js.paystack.co/v2/inline.js` at runtime and the popup is an iframe. Static analysis of that
  script (fetched 2026-10-09) references `checkout.paystack.com`, `standard.paystack.co`, `api.paystack.co`, `checkout-studio.paystack.com`, `studio-api.paystack.co`,
  `paystack.com`, plus Apple Pay / Google Pay endpoints; it uses no `eval`. The policy allows `https://*.paystack.co` and `https://*.paystack.com`
  for script/connect/frame/img and `js.paystack.co` for scripts. **The real popup flow needs a Paystack test key and was not exercised**, which is one more reason the CSP stays report-only.
- **Authentication and API connectivity:** the browser calls the backend cross-origin with credentials (`NEXT_PUBLIC_API_BASE_URL`, baked in at build). `connect-src` therefore
  includes that origin; the session cookie is set by the backend and is unaffected by frontend headers. Missing it would block every API call, so the origin comes from the same variable.
- **Third-party resources:** the frontend loads nothing else from outside (no analytics, CDN, external images or fonts).
- **Permissions-Policy:** `camera`, `microphone`, `geolocation` disabled. `payment` is deliberately left at its default so Paystack's iframe keeps Apple/Google Pay delegation.
- **COOP:** `same-origin-allow-popups` (the Paystack popup is an iframe; strict `same-origin` or any COEP/CORP would break it).
- **HSTS:** `max-age=300` (sticky in browsers; no `includeSubDomains`/`preload`), production only; Render already redirects HTTP to HTTPS.
- **Render/Cloudflare:** may add or strip headers; re-check with `curl -sI` after a deploy.

## Headers (all routes)
| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Strict-Transport-Security` | `max-age=300` (production only) |
| `Content-Security-Policy-Report-Only` | see below (**not enforced**) |
| `X-Powered-By` | removed (`poweredByHeader: false`) |

CSP (report-only): `default-src 'self'`; `script-src 'self' 'unsafe-inline' https://js.paystack.co` (+ `'unsafe-eval'` in dev); `style-src 'self' 'unsafe-inline'`;
`img-src 'self' data: https://*.paystack.co https://*.paystack.com`; `font-src 'self' data:`; `connect-src 'self' <API origin> https://*.paystack.co https://*.paystack.com`
(+ `http://localhost:* ws://localhost:*` in dev); `frame-src https://*.paystack.co https://*.paystack.com`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`;
`object-src 'none'`; `manifest-src 'self'`. No `report-uri`/`report-to`: a collector would be new infrastructure (CLAUDE.md rules 18/26), so violations are observed in the browser
console and by the automated `securitypolicyviolation` sweep.

## Rollout and exit criteria for enforcement (a later, separate change)
1. Deploy report-only to staging (a frontend deploy needs approval); `curl -sI` before and after to confirm Render/Cloudflare neither duplicate nor strip the headers, and that
   `connect-src` contains the backend URL (`NEXT_PUBLIC_API_BASE_URL` is baked in at **build** time; if it were missing the policy would fall back to `http://localhost:4000`).
2. A real Paystack **test-key** checkout (card, 3-D Secure, Apple/Google Pay where supported) and the main journeys are exercised with the console open: zero violations of our policy.
3. Replace the `https://*.paystack.co` / `https://*.paystack.com` wildcards with the exact hosts seen in step 2 (candidates: `frame-src https://checkout.paystack.com`; `connect-src`
   `https://api.paystack.co` and the others actually observed; `script-src` stays `https://js.paystack.co`), and decide `worker-src`/`child-src` (security review W1).
4. Add a production **build guard** that fails the build when `NEXT_PUBLIC_API_BASE_URL` is unset or unparsable (security review W2); a wrong value is harmless in report-only but
   would block every API call once enforcing.
5. Then switch the header name to `Content-Security-Policy` (one-line change; rollback = revert it) and re-run the suites. Removing `'unsafe-inline'` (nonces) is a separate P2 decision.

## Verification performed (2026-10-09/10, local)
- Unit tests (`frontend/tests/securityHeaders.test.ts`, 12): baseline headers, report-only (never the enforcing header), HSTS production-only, API origin in `connect-src`
  (a mutation that dropped it or switched to the enforcing header makes 3 tests fail), `unsafe-eval`/websockets dev-only, only Paystack third-party hosts, no wildcard in
  `default-src`/`script-src`, unusable API URL handled.
- E2E journey (`e2e/tests/flowJ-security-headers.spec.ts`): headers on the document response, and a `securitypolicyviolation` sweep over sign-up, trial, QA setup, Projects
  (empty state, create dialog, list, reload) expecting **zero** violations; a mutation that removed `'unsafe-inline'` from `style-src` made it fail with the violations listed.
- **Production mode** (`next build` + `next start`, API at `http://localhost:4300`): response headers exactly as designed (HSTS present, no `X-Powered-By`, `connect-src`
  contains the API origin taken from `NEXT_PUBLIC_API_BASE_URL`, no dev allowances) and the same journey raised zero violations.
- **Paystack under the production policy** (script loaded from `js.paystack.co`, `new PaystackPop().resumeTransaction('<invalid code>')`: a lookup only, no payment): the script
  executed, the popup iframe `https://checkout.paystack.com/popup` rendered, the lookup reached `https://api.paystack.co`, and **our policy recorded no violation**. Violations that were
  reported belonged to Paystack's own checkout page against **Paystack's own** policy (their Google Tag Manager, Pusher and PostHog scripts), not to ours. The valid-card/test-key
  flow, 3-D Secure and Apple/Google Pay were **not** exercised (no key); that, and observation on staging, are the exit criteria for enforcement.

## Independent reviews (2026-10-10)
`frontend-reviewer`: PASS (no HIGH/MEDIUM; LOW: a missing build-time API URL silently falls back to localhost, and the E2E journey runs on `next dev` so it never checks HSTS or the production policy).
`security`: PASS WITH WARNINGS (W1 wildcards, W2 build guard, both recorded above; confirmed the full header set on six URLs of a local production build, no enforcing CSP).
`qa`: PASS (production-mode headers, Flow J 1/1 and zero violations in production mode, `/login` and `/projects` byte-identical to a `main` build, framing refused by `X-Frame-Options`).
Known gaps: Flow J only runs against `next dev`, so production headers/HSTS are covered by unit tests and manual `curl`; the real Paystack card flow was not exercised.
