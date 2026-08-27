# API — Subscription & Billing

**Module:** SUB. New module document — no placeholder previously existed for this. See `docs/technical/api-spec.md` for shared conventions, especially idempotency (APID-006) — critical throughout this module.

---

## View Subscription State

**Requirement IDs:** FR-SUB-003.
**Purpose:** View the organisation's current plan and seat state.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `GET /organisations/{orgId}/subscription`
**Request:** Path: `orgId`.
**Successful Response:** `200 OK` — subscription resource (`planType`, `status`, `trialUsed`, seat totals aggregated across all Seat Batches, and, for yearly plans, each batch's independent renewal date — PD-027).
**Business Rules:** None beyond visibility restriction.
**Error Conditions:** `403 forbidden` (QA Tester or link-based role).
**Side Effects:** None.

---

## Start Trial

**Requirement IDs:** FR-SUB-001.
**Purpose:** Activate the one-time, 14-day, 3-seat-capped trial.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `POST /organisations/{orgId}/subscription/trial`
**Request:** Path: `orgId`. Header: `Idempotency-Key`.
**Successful Response:** `201 Created` — subscription with `planType: trial`, `trialEndsAt` set to +14 days.
**Business Rules:** Blocked (`409 conflict`) if `organisation.trialUsed = true` — permanently, whether the prior trial expired or was converted to paid (PD-021).
**Error Conditions:** `409 conflict` (trial already used).
**Side Effects:** Creates Subscription and a 3-seat Seat Batch; sets `organisation.trialUsed = true` permanently.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Idempotency key prevents a double-click from being misread as "trial already used."

---

## Subscribe Monthly / Yearly

**Requirement IDs:** FR-SUB-004, FR-SUB-005.
**Purpose:** Convert to (or start directly on) a paid plan.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `POST /organisations/{orgId}/subscription/monthly`; `POST /organisations/{orgId}/subscription/yearly`
**Request:** Path: `orgId`. Body: `seatCount`. Header: `Idempotency-Key` (critical here — prevents double-charging on retry).
**Successful Response:** `201 Created` — updated subscription and the new Seat Batch, plus the amount charged (`seatCount × $10` monthly, or `seatCount × $9 × 12` yearly, shown before final confirmation per PD-022/023 — the client is expected to have already shown this total to the user before calling this endpoint, consistent with "total shown before payment").
**Business Rules:** All amounts in USD. Payment is all-or-nothing (NFR-REL-003) — either the plan/seats activate and a confirmation email sends, or nothing happens; never a partial state.
**Error Conditions:** `422 validation_error` (invalid seat count); `402`/`409 conflict` (payment failed — no seats/plan activated).
**Side Effects:** Creates a Seat Batch and Payment; sends confirmation email (FR-SUB-006); initiates the charge via the external payment provider.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** No raw payment card data is ever accepted by this endpoint or stored by TestFlow AI (NFR-SEC-012) — the actual card handling happens with the external payment provider, out of this API's scope.

---

## Purchase Additional Seats

**Requirement IDs:** FR-SUB-007, FR-SUB-008, FR-SUB-011.
**Purpose:** Add seats proactively (any time) or in response to a blocked invitation.
**Actor/Permission:** Admin, QA Manager.
**Method and Path:** `POST /organisations/{orgId}/seats`
**Request:** Path: `orgId`. Body: `seatCount`. Header: `Idempotency-Key`.
**Successful Response:** `201 Created` — the new Seat Batch (with its own independent renewal date if on a yearly plan — PD-027, staggered renewal).
**Business Rules:** On trial, adding seats beyond the 3-seat cap requires converting to a paid plan first (`409 conflict` otherwise, directing to the monthly/yearly endpoints). Seats can only ever increase — no corresponding "reduce seats" endpoint exists (PD-028).
**Error Conditions:** `409 conflict` (still on trial and would exceed 3 seats); payment failure per NFR-REL-003.
**Side Effects:** Creates a Seat Batch and Payment; sends confirmation email.
**Audit Behaviour:** Reasonable to log.

---

## View Billing/Seat History

**Requirement IDs:** FR-SUB-012.
**Purpose:** View past payments and seat purchases.
**Actor/Permission:** Admin, QA Manager **only** — no other role has any access (PD-047).
**Method and Path:** `GET /organisations/{orgId}/billing-history`
**Request:** Path: `orgId`. Query: pagination.
**Successful Response:** `200 OK` — list of Payments and Seat Batches (amount, plan, date, status).
**Business Rules:** None beyond the strict visibility restriction.
**Error Conditions:** `403 forbidden` (QA Tester or link-based role).
**Side Effects:** None.
**Security Considerations:** Enforced at the API layer itself, same principle as `audit.md`.

---

## Payment Provider Webhook

**Requirement IDs:** NFR-REL-003, NFR-OBS-003.
**Purpose:** Internal integration point — not a user-facing API — through which the external payment provider confirms success/failure of a charge asynchronously.
**Actor/Permission:** The payment provider only (verified via provider-specific signature/secret, not a TestFlow user session).
**Method and Path:** `POST /webhooks/payments`
**Request:** Provider-defined payload (not a TestFlow-authored contract).
**Successful Response:** `200 OK` (acknowledged).
**Business Rules:** Must reconcile with the originating Payment record such that the system never ends up with a payment marked successful without corresponding seat activation, or vice versa (NFR-REL-003) — monitored per NFR-OBS-003.
**Error Conditions:** Signature verification failure rejected outright.
**Side Effects:** Updates Payment status; may activate a Seat Batch/Subscription if not already reflected.
**Audit Behaviour:** Reasonable to log.
**Security Considerations:** Must verify the webhook's authenticity (signature) before acting on it — this is the one endpoint in the entire API not authenticated via TestFlow's own session or link mechanism.
