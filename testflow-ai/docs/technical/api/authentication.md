# API — Authentication

**Module:** AUTH. See `docs/technical/api-spec.md` for shared conventions (versioning, error format, pagination, etc.) — not repeated here.

---

## Sign Up

**Requirement IDs:** FR-AUTH-001, FR-AUTH-004, FR-AUTH-005, FR-AUTH-006, FR-ORG-001.
**Purpose:** Creates a brand-new organisation and its first user in one step.
**Actor/Permission:** Public (no prior account).
**Method and Path:** `POST /auth/signup`
**Request:**
- Body: `email`, `password`, `name`, `role` (`admin` | `qa_manager` only — FR-AUTH-005), `organisationName`.
**Successful Response:** `201 Created` — the new user and organisation, plus a session established (equivalent to being logged in immediately). Response also indicates redirect target: the subscription page (FR-AUTH-006).
**Business Rules:** Role field only accepts `admin`/`qa_manager` (FR-AUTH-005). Organisation is created and tied to this user (FR-ORG-001). No platform functionality beyond this and the subscription flow is accessible until a trial/paid plan is active (FR-SUB-002) — enforced at every other endpoint, not here.
**Error Conditions:** `422 validation_error` (missing/invalid fields, role outside allowed set); `409 conflict` (email already registered — exact handling of duplicate email is an open item, see `functional-requirements.md` Open Questions).
**Side Effects:** Creates Organisation and User records; sends confirmation email (FR-AUTH-004, background job); establishes a session.
**Audit Behaviour:** Organisation/user creation is not on the FR-AUD-001 minimum list but is reasonable to log; treated as auditable.
**Security Considerations:** Public endpoint — must apply standard brute-force/abuse protection on repeated signup attempts (NFR-SEC-001-style protection, though that NFR specifically targets login).
**Notes:** This is the only endpoint that creates an Organisation.

---

## Log In

**Requirement IDs:** FR-AUTH-002.
**Purpose:** Authenticates an existing organisation member.
**Actor/Permission:** Any existing Admin/QA Manager/QA Tester account.
**Method and Path:** `POST /auth/login`
**Request:** Body: `email`, `password`.
**Successful Response:** `200 OK` — session established; returns the authenticated user's profile (id, name, role, organisationId).
**Business Rules:** None beyond standard authentication.
**Error Conditions:** `401 unauthorized` (invalid credentials — no detail disclosed on which field was wrong); `403 forbidden` (account status = removed).
**Side Effects:** Establishes a session.
**Audit Behaviour:** Not audited (routine access, not a "key action").
**Security Considerations:** Protected against brute force per NFR-SEC-001 (protective response after 5 consecutive failed attempts within a short window).

---

## Log Out

**Requirement IDs:** FR-AUTH-003.
**Purpose:** Ends the current session.
**Actor/Permission:** Any authenticated organisation member.
**Method and Path:** `POST /auth/logout`
**Request:** None beyond the authenticated session context.
**Successful Response:** `204 No Content`.
**Business Rules:** None.
**Error Conditions:** `401 unauthorized` (no active session).
**Side Effects:** Terminates the session.
**Audit Behaviour:** Not audited.
**Security Considerations:** Session token invalidated server-side, not just discarded client-side (NFR-SEC-002).

---

## Accept Invitation

**Requirement IDs:** FR-ORG-004.
**Purpose:** Converts a pending invitation into a new organisation membership (and a new user account, if the invitee has none).
**Actor/Permission:** The invited email's holder (public, pre-authentication, identified via the invitation token).
**Method and Path:** `POST /invitations/{invitationId}/accept`
**Request:** Path: `invitationId`. Body: `password`, `name` (if a new account is being created).
**Successful Response:** `200 OK` — the new/updated user, now a member of the organisation with the role set at invitation time (FR-ORG-005); session established.
**Business Rules:** Invitation must be `pending`, not `expired`/already `accepted`.
**Error Conditions:** `404 not_found` (invalid invitation token); `409 conflict` (already accepted or expired).
**Side Effects:** Creates a User (if new) and an Organisation Membership relationship; marks Invitation `accepted`.
**Audit Behaviour:** Audited (new organisation member).
**Security Considerations:** The invitation token itself is the credential for this one action — treat with the same care as an Access Link (unguessable, single-purpose).
