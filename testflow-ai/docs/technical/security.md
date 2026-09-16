# Security

## Review workflow

Application security review is performed by the `security` subagent (`.claude/agents/security.md`),
which reviews and reports — it does not silently modify product code. It runs:

- on relevant new implementations and fixes (ad hoc, as part of the normal Implementation → Unit
  Tests → QA → Security → DevOps → Deployment flow — see CLAUDE.md rule 20)
- as a required pre-deployment check, before the `devops` agent deploys anything
- on manual request — the user can invoke it by saying "Security"

Every review ends in exactly one of: `SECURITY STATUS: PASS`, `PASS WITH WARNINGS`, or `FAIL`. A
`FAIL` does not automatically block deployment — the user is always the final decision-maker — but
the agent must clearly explain the risk and explicitly ask before deployment proceeds.

See `.claude/agents/security.md` for the full list of review areas (authN/authZ, tenant isolation,
session/cookie security, input validation, injection, XSS, CSRF, CORS, secrets exposure,
dependency vulnerabilities, API security, payment/webhook security, insecure configuration,
production/test isolation, OWASP risks generally).

## Standing security rules (already enforced in code — see the security agent for how these are verified)

- **Tenant isolation** (CLAUDE.md rule 14, NFR-SEC-003): every request resolves its organisation
  server-side; a resource belonging to another organisation returns 404, never 403.
- **Session cookies**: `httpOnly` always; `secure` + `SameSite=None` in production (required by
  the frontend/backend cross-origin topology); `SameSite=Lax` in development.
- **Brute-force protection** (NFR-SEC-001): login locks out after 5 failed attempts within a
  rolling window, tracked server-side (`backend/src/lib/bruteForce.ts`).
- **Payment authority** (NFR-REL-003): a paid subscription/seat batch is created *only* by the
  Paystack webhook after signature verification against the raw request body — never by a
  browser-side "payment succeeded" callback.
- **Production/test isolation**: `E2E_FAKE_PAYMENTS`/`NEXT_PUBLIC_E2E_FAKE_PAYMENTS` and the
  `modules/testSupport` router are hard double-gated (`env.e2eFakePayments && !isProduction`) —
  the flag alone is never sufficient to enable the fake-payment path in production.
- **Swagger UI**: served at `/docs` outside production by default; never exposed in a production
  deployment unless someone explicitly sets `SWAGGER_UI_ENABLED=true` (CLAUDE.md rule 21).
- **Secrets**: never printed, logged, or committed. `.env.example` files document variable
  purpose without real values; real credential-bearing files (`.env`, `.env.local`, `.mcp.json`,
  `.neon`) are gitignored.
