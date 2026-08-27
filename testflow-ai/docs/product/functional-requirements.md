# TestFlow AI — Functional Requirements (FR)

**Source documents:** vision.md, prd.md, product-decisions.md (all approved)
**Status:** Approved — reflects all product decisions through PD-047.
**Scope:** This document specifies functional (behavioural) requirements only. It does not specify technology, database design, API design, architecture, or UI design.

---

## How to Read This Document

Requirements are grouped by module, using the module prefixes already referenced across vision.md, prd.md, and non-functional-requirements.md (e.g., `FR-TC-005`, `FR-LNK-001`, `FR-SUB-007`). Each requirement includes: Requirement ID, Title, Requirement ("The system shall..."), Purpose, Actors, Preconditions, Main Behaviour, Business Rules, Acceptance Criteria (Given/When/Then), Error/Edge Conditions, Priority, Dependencies.

Requirements corresponding to product decisions carry a `(PD-xxx)` reference. Requirements newly added or substantively rewritten to reflect the most recent decision round (PD-030–PD-047) are marked **[Updated]** or **[New]** in their title line for traceability; this marking is descriptive only and may be removed in a future documentation pass once the change has settled.

---

## Requirement Index

| ID | Title | Module | Priority |
|---|---|---|---|
| FR-AUTH-001 | Public Sign-Up | AUTH | MVP |
| FR-AUTH-002 | Login | AUTH | MVP |
| FR-AUTH-003 | Session Management | AUTH | MVP |
| FR-AUTH-004 | Sign-Up Confirmation Email | AUTH | MVP |
| FR-AUTH-005 | Sign-Up Role Restriction | AUTH | MVP |
| FR-AUTH-006 | Post-Sign-Up Redirect to Subscription | AUTH | MVP |
| FR-ORG-001 | Organisation Creation at Sign-Up | ORG | MVP |
| FR-ORG-002 | Unlimited Organisations | ORG | MVP |
| FR-ORG-003 | Organisation Settings Management | ORG | MVP |
| FR-ORG-004 | Invite Organisation Member | ORG | MVP |
| FR-ORG-005 | Set Role at Invitation | ORG | MVP |
| FR-ORG-006 | Minimum One Admin Enforcement **[Updated]** | ORG | MVP |
| FR-USR-001 | Organisation-Level Role Assignment | USR | MVP |
| FR-USR-002 | Role Governs Cross-Project Capability | USR | MVP |
| FR-USR-003 | Role Change — Admin Only **[Updated]** | USR | MVP |
| FR-USR-004 | Removed Project Creator Access Handling **[Updated]** | USR | MVP |
| FR-USR-005 | Remove Organisation Member | USR | MVP |
| FR-USR-006 | View Organisation Member List | USR | MVP |
| FR-USR-007 | QA Tester Project Membership Management | USR | MVP |
| FR-PRJ-001 | Create Project | PRJ | MVP |
| FR-PRJ-002 | Update Project | PRJ | MVP |
| FR-PRJ-003 | Archive Project | PRJ | MVP |
| FR-PRJ-004 | Project Visibility by Role | PRJ | MVP |
| FR-PRJ-005 | Add User to Project | PRJ | MVP |
| FR-PRJ-006 | Remove User from Project | PRJ | MVP |
| FR-PRJ-007 | Removed Project Creator — Admin/QA Manager Access Retained **[Updated]** | PRJ | MVP |
| FR-REQ-001 | Native Requirement Authoring | REQ | MVP |
| FR-REQ-002 | Editing a Linked Requirement Triggers Re-Review **[Updated]** | REQ | MVP |
| FR-REQ-003 | Optional Requirement–Test-Case Link | REQ | MVP |
| FR-REQ-004 | Requirement Archive Cascade, Including Active Test Runs **[Updated]** | REQ | MVP |
| FR-TC-001 | Create Test Case | TC | MVP |
| FR-TC-002 | Edit Test Case | TC | MVP |
| FR-TC-003 | Test Case Versioning | TC | MVP |
| FR-TC-004 | Test Run Snapshot of Test Case Content | TC | MVP |
| FR-TC-005 | Test Case Status Model, Approval, and Self-Approval **[Updated]** | TC | MVP |
| FR-TC-006 | Optional Requirement Linkage | TC | MVP |
| FR-TC-007 | Review and Comment on Test Cases | TC | MVP |
| FR-TC-008 | Test Case Template Application | TC | MVP |
| FR-TC-009 | Assign Test Case to Suite | TC | MVP |
| FR-TC-010 | AI-Generated Test Case Flagging | TC | MVP |
| FR-AI-001 | Generate Test Cases from Requirement | AI | MVP |
| FR-AI-002 | Mandatory Human Review Before Save | AI | MVP |
| FR-AI-003 | Optional Per-Project AI Provider Key | AI | MVP |
| FR-AI-004 | Platform-Provided AI Option | AI | MVP |
| FR-AI-005 | AI Generation Scope Limited to Requirements | AI | MVP |
| FR-TS-001 | Create Test Suite | TS | MVP |
| FR-TS-002 | Organize Test Cases into Suite | TS | MVP |
| FR-TR-001 | Create Test Run | TR | MVP |
| FR-TR-002 | Snapshot Test Case Content at Run Creation | TR | MVP |
| FR-TR-003 | Close Test Run | TR | MVP |
| FR-TR-004 | Test Run Progress Aggregation | TR | MVP |
| FR-EXEC-001 | Record Execution Result | EXEC | MVP |
| FR-EXEC-002 | Attach Evidence to Result | EXEC | MVP |
| FR-EXEC-003 | Execution Result Immutability After Run Closure **[Updated]** | EXEC | MVP |
| FR-DEF-001 | Log Defect | DEF | MVP |
| FR-DEF-002 | Assign Defect to Developer | DEF | MVP |
| FR-DEF-003 | Update Defect Status via Link | DEF | MVP |
| FR-DEF-004 | Link Defect to Test Case/Result | DEF | MVP |
| FR-DEF-005 | Defect History | DEF | MVP |
| FR-DEF-006 | Notify Developer of Defect Assignment | DEF | MVP |
| FR-TRACE-001 | Requirement-to-Defect Traceability Chain | TRACE | MVP |
| FR-TRACE-002 | Traced vs. Untraced Test Case Reporting | TRACE | MVP |
| FR-RPT-001 | On-Demand Report Generation | RPT | MVP |
| FR-RPT-002 | Single Report Type with Post-Deployment Section **[Updated]** | RPT | MVP |
| FR-RPT-003 | BA/PO Report Approval/Rejection — Record-Keeping Only **[Updated]** | RPT | MVP |
| FR-RPT-004 | BA/PO Report Comments — Private to QA Tester **[New]** | RPT | MVP |
| FR-DASH-001 | Project Progress Dashboard | DASH | MVP |
| FR-DASH-002 | Test Run Progress Widget | DASH | MVP |
| FR-DASH-003 | Stakeholder Read-Only Dashboard View | DASH | MVP |
| FR-AUD-001 | Audit Log of Key Actions | AUD | MVP |
| FR-AUD-002 | Audit Entries for Link-Based Actions | AUD | MVP |
| FR-AUD-003 | Audit History Visibility Restricted to QA Manager/Admin **[Updated]** | AUD | MVP |
| FR-AUD-004 | Audit Entry Attribution and Timestamping | AUD | MVP |
| FR-NOT-001 | In-App Notifications for Organisation Members | NOT | MVP |
| FR-NOT-002 | Email Notifications for All Roles | NOT | MVP |
| FR-NOT-003 | Email as Sole Delivery Mechanism for Link-Based Roles | NOT | MVP |
| FR-NOT-004 | Maintenance Notification | NOT | Post-MVP |
| FR-NOT-005 | Notification/Link Delivery Retry | NOT | MVP |
| FR-LNK-001 | Generate Temporary Access Link, Configurable Expiry **[Updated]** | LNK | MVP |
| FR-LNK-002 | No Identity Verification for Link Recipients **[Updated]** | LNK | MVP |
| FR-LNK-003 | Named or Generic Link Recipient **[Updated]** | LNK | MVP |
| FR-LNK-004 | Multi-Use Link Until Expiry or Revocation **[Updated]** | LNK | MVP |
| FR-LNK-005 | Link Revocation | LNK | MVP |
| FR-LNK-006 | Free Sharing of Link by Holder **[New]** | LNK | MVP |
| FR-SUB-001 | Trial Plan | SUB | MVP |
| FR-SUB-002 | Mandatory Subscription for Platform Access | SUB | MVP |
| FR-SUB-003 | Plan Selection (Trial, Monthly, Yearly) | SUB | MVP |
| FR-SUB-004 | Monthly Subscription Plan | SUB | MVP |
| FR-SUB-005 | Yearly Subscription Plan | SUB | MVP |
| FR-SUB-006 | Payment Confirmation Email | SUB | MVP |
| FR-SUB-007 | Seat Limit Enforcement on Invitation | SUB | MVP |
| FR-SUB-008 | Proactive Seat Purchase | SUB | MVP |
| FR-SUB-009 | Seats Only Increase, No Refunds | SUB | MVP |
| FR-SUB-010 | Grace Period on Subscription Lapse | SUB | MVP |
| FR-SUB-011 | Staggered Renewal for Mid-Term Yearly Seat Purchases | SUB | MVP |
| FR-SUB-012 | Billing and Seat History Visibility Restricted to Admin/QA Manager **[Updated]** | SUB | MVP |
| FR-IMP-001 | Bulk Import | IMP | Post-MVP |
| FR-IMP-002 | Bulk Export | IMP | Post-MVP |
| FR-IMP-003 | Import/Export Entity Scope | IMP | Post-MVP |

**Total requirements: 99**

---

# AUTH — Authentication & Sign-Up

### FR-AUTH-001 — Public Sign-Up
**Requirement:** The system shall provide a public sign-up form for brand-new customers, distinct from the organisation-level invitation flow.
**Purpose:** Lets a new customer create an organisation without needing an existing member to invite them.
**Actors:** Prospective customer (not yet a user).
**Preconditions:** None — publicly accessible.
**Main Behaviour:** User submits sign-up details, including a chosen role (FR-AUTH-005) and new organisation name (FR-ORG-001).
**Business Rules:** Sign-up is the only entry point that creates a new organisation from scratch (PD-019).
**Acceptance Criteria:** Given a prospective customer with no account, When they complete the sign-up form, Then a new user and a new organisation are created and linked.
**Error/Edge Conditions:** Duplicate email at sign-up is rejected (specific handling: Open Question, see below).
**Priority:** MVP
**Dependencies:** FR-ORG-001, FR-AUTH-005

### FR-AUTH-002 — Login
**Requirement:** The system shall allow an existing user to authenticate and access the organisation(s)/projects they belong to.
**Purpose:** Standard re-entry to the platform.
**Actors:** All account-holding roles (Admin, QA Manager, QA Tester).
**Preconditions:** User has an existing account.
**Main Behaviour:** User submits credentials; system establishes a session on success.
**Business Rules:** None beyond standard authentication.
**Acceptance Criteria:** Given valid credentials, When submitted, Then the user is authenticated and sees their organisation(s).
**Error/Edge Conditions:** Invalid credentials are rejected with no account detail disclosed.
**Priority:** MVP
**Dependencies:** FR-AUTH-001

### FR-AUTH-003 — Session Management
**Requirement:** The system shall maintain an authenticated session for a logged-in user until logout or session expiry.
**Purpose:** Avoids requiring re-authentication on every action.
**Actors:** All account-holding roles.
**Preconditions:** User has logged in.
**Main Behaviour:** Session persists across requests until logout/expiry.
**Business Rules:** Session duration/expiry policy: not yet decided (see Open Questions).
**Acceptance Criteria:** Given an active session, When the user navigates the app, Then they remain authenticated without re-entering credentials.
**Error/Edge Conditions:** Expired session redirects to login.
**Priority:** MVP
**Dependencies:** FR-AUTH-002

### FR-AUTH-004 — Sign-Up Confirmation Email
**Requirement:** The system shall send a confirmation email to the user upon successful sign-up.
**Purpose:** Confirms account/organisation creation succeeded.
**Actors:** New user (Admin or QA Manager).
**Preconditions:** Sign-up form submitted successfully.
**Main Behaviour:** Confirmation email sent immediately after account/organisation creation.
**Business Rules:** PD-019.
**Acceptance Criteria:** Given a successful sign-up, When the organisation and user are created, Then a confirmation email is sent to the user.
**Error/Edge Conditions:** Email delivery failure — see FR-NOT-005 retry rule.
**Priority:** MVP
**Dependencies:** FR-AUTH-001, FR-NOT-005

### FR-AUTH-005 — Sign-Up Role Restriction
**Requirement:** The system shall restrict the role selectable at public sign-up to Admin or QA Manager only.
**Purpose:** QA Tester and link-based roles are only meaningful once an organisation exists; sign-up must create a user capable of managing/bootstrapping the organisation.
**Actors:** Prospective customer.
**Preconditions:** User is on the sign-up form.
**Main Behaviour:** Role selector at sign-up presents exactly two options: Admin, QA Manager.
**Business Rules:** PD-019. QA Tester is added only via organisation invitation (FR-ORG-004) after the organisation exists.
**Acceptance Criteria:** Given the sign-up form, When the user views role options, Then only Admin and QA Manager are selectable.
**Error/Edge Conditions:** Any attempt to submit a role outside Admin/QA Manager is rejected.
**Priority:** MVP
**Dependencies:** FR-AUTH-001

### FR-AUTH-006 — Post-Sign-Up Redirect to Subscription
**Requirement:** The system shall redirect the user to the subscription page immediately after successful sign-up.
**Purpose:** Continues onboarding directly into the mandatory subscription step (FR-SUB-002).
**Actors:** New user.
**Preconditions:** Sign-up completed successfully.
**Main Behaviour:** User is routed to the subscription/plan-selection page.
**Business Rules:** PD-019, PD-020.
**Acceptance Criteria:** Given a successful sign-up, When the user is created, Then they are redirected to the subscription page.
**Error/Edge Conditions:** None beyond standard navigation failure handling.
**Priority:** MVP
**Dependencies:** FR-AUTH-001, FR-SUB-002, FR-SUB-003

---

# ORG — Organisation Management

### FR-ORG-001 — Organisation Creation at Sign-Up
**Requirement:** The system shall create a new organisation, named by the user, as part of the public sign-up process.
**Purpose:** Establishes the tenant boundary for a new customer.
**Actors:** New user (Admin or QA Manager).
**Preconditions:** User is completing sign-up.
**Main Behaviour:** User provides an organisation name; system creates the organisation and ties the new user to it as its first member.
**Business Rules:** PD-019.
**Acceptance Criteria:** Given a sign-up submission with an organisation name, When submitted, Then a new organisation is created and the user is its first member with the role chosen at sign-up.
**Error/Edge Conditions:** Organisation name uniqueness policy: not yet decided (see Open Questions).
**Priority:** MVP
**Dependencies:** FR-AUTH-001

### FR-ORG-002 — Unlimited Organisations
**Requirement:** The system shall support an unlimited number of organisations, each with an unlimited number of projects.
**Purpose:** Matches the approved multi-tenant vision.
**Actors:** N/A (platform-level).
**Preconditions:** None.
**Main Behaviour:** No application-level ceiling on organisation or project count.
**Business Rules:** PD-001.
**Acceptance Criteria:** Given the platform in operation, When new organisations are created, Then no hard-coded limit blocks creation.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-ORG-003 — Organisation Settings Management
**Requirement:** The system shall allow an Admin to manage organisation-level settings.
**Purpose:** Gives the organisation owner control over shared configuration.
**Actors:** Admin.
**Preconditions:** User holds the Admin role in the organisation.
**Main Behaviour:** Admin views/edits organisation settings.
**Business Rules:** Scope of "organisation settings" beyond membership/subscription: not yet fully defined (see Open Questions).
**Acceptance Criteria:** Given an Admin, When they open organisation settings, Then they can view and modify them.
**Error/Edge Conditions:** Non-Admin attempting access is denied.
**Priority:** MVP
**Dependencies:** FR-USR-001

### FR-ORG-004 — Invite Organisation Member
**Requirement:** The system shall allow Admin or QA Manager to invite a new member to the organisation, setting their role at invitation time.
**Purpose:** Standard path for adding QA Tester, and additional Admin/QA Manager, accounts after the organisation exists.
**Actors:** Admin, QA Manager (inviter); invitee (Admin, QA Manager, or QA Tester).
**Preconditions:** Inviter holds Admin or QA Manager role; organisation has available seats (FR-SUB-007).
**Main Behaviour:** Inviter sends an invitation with a role assignment; invitee accepts and becomes an organisation member.
**Business Rules:** PD-017. Blocked if no seats available (FR-SUB-007).
**Acceptance Criteria:** Given available seats, When an Admin or QA Manager invites a user with a role, Then the invitee is added as an organisation member with that role upon acceptance.
**Error/Edge Conditions:** Invitation blocked and redirected to seat purchase if it would exceed the seat count (FR-SUB-007).
**Priority:** MVP
**Dependencies:** FR-USR-001, FR-SUB-007

### FR-ORG-005 — Set Role at Invitation
**Requirement:** The system shall require the inviter to specify the invitee's role (Admin, QA Manager, or QA Tester) at the time of invitation.
**Purpose:** Establishes the invitee's organisation-level role from the outset.
**Actors:** Admin, QA Manager.
**Preconditions:** Inviter is creating an invitation.
**Main Behaviour:** Role is a required field on the invitation.
**Business Rules:** PD-017.
**Acceptance Criteria:** Given an invitation being created, When the inviter submits it without a role, Then submission is rejected.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-004

### FR-ORG-006 — Minimum One Admin Enforcement **[Updated]**
**Requirement:** The system shall ensure an organisation always retains at least one member with the Admin role. The system shall prevent the last remaining Admin from being removed from the organisation, or from having their role changed away from Admin.
**Purpose:** Prevents an organisation from being left without anyone able to perform Admin-level actions (PD-030).
**Actors:** Admin (attempting the change or removal); the last remaining Admin (subject).
**Preconditions:** The organisation currently has exactly one Admin.
**Main Behaviour:** Any attempt to remove the last Admin, or change their role, is blocked before it takes effect.
**Business Rules:** PD-030. This rule takes precedence over FR-USR-003 (role change) and FR-USR-005 (member removal) when only one Admin remains.
**Acceptance Criteria:**
- Given an organisation with exactly one Admin, When that Admin attempts to change their own role or another Admin attempts to change it, Then the change is rejected.
- Given an organisation with exactly one Admin, When any user attempts to remove that Admin from the organisation, Then the removal is rejected.
**Error/Edge Conditions:** A clear error message is shown explaining the organisation must retain at least one Admin; the action is not silently ignored.
**Priority:** MVP
**Dependencies:** FR-USR-003, FR-USR-005

---

# USR — User & Access Management

### FR-USR-001 — Organisation-Level Role Assignment
**Requirement:** The system shall assign each organisation member exactly one role (Admin, QA Manager, or QA Tester) at the organisation level.
**Purpose:** Establishes a single, consistent role per user across the organisation.
**Actors:** Admin, QA Manager (assigning); all organisation members (subject).
**Preconditions:** User is being invited or already a member.
**Main Behaviour:** Role is stored at the organisation level, not per project.
**Business Rules:** PD-017, supersedes PD-003.
**Acceptance Criteria:** Given an organisation member, When their role is queried, Then exactly one organisation-level role is returned.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-005

### FR-USR-002 — Role Governs Cross-Project Capability
**Requirement:** The system shall apply a user's organisation-level role to determine their capabilities on every project they have access to.
**Purpose:** Avoids re-deciding permissions per project.
**Actors:** All organisation members.
**Preconditions:** User has access to at least one project.
**Main Behaviour:** Adding a user to a project is an access grant only; their existing organisation role governs what they can do there.
**Business Rules:** PD-017.
**Acceptance Criteria:** Given a user with an organisation role, When they are added to a new project, Then their capabilities on that project match their existing organisation role, with no separate role assignment step.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-001, FR-PRJ-005

### FR-USR-003 — Role Change — Admin Only **[Updated]**
**Requirement:** The system shall allow only a user with the Admin role to change another organisation member's role. QA Manager shall not be able to change another member's role.
**Purpose:** Keeps role-changing authority — a sensitive, organisation-wide permission change — concentrated in the Admin role (PD-031).
**Actors:** Admin (actor); any organisation member (subject).
**Preconditions:** Actor holds the Admin role; subject is an existing organisation member.
**Main Behaviour:** Admin selects a member and assigns a new role (Admin, QA Manager, or QA Tester); change takes effect immediately.
**Business Rules:** PD-031. Subject to FR-ORG-006 (cannot change the last remaining Admin away from Admin).
**Acceptance Criteria:**
- Given an Admin, When they change another member's role, Then the new role takes effect immediately.
- Given a QA Manager, When they attempt to change another member's role, Then the action is rejected.
**Error/Edge Conditions:** Attempt to change the last remaining Admin's role is blocked per FR-ORG-006.
**Priority:** MVP
**Dependencies:** FR-USR-001, FR-ORG-006

### FR-USR-004 — Removed Project Creator Access Handling **[Updated]**
**Requirement:** The system shall ensure that when a project's creator is removed from that project, or loses organisation access entirely, only the removed creator loses access to the project; Admin and QA Manager retain whatever access to that project they already had.
**Purpose:** Prevents a project from losing its Admin/QA Manager oversight access purely as a side effect of the original creator leaving (PD-032).
**Actors:** Admin, QA Manager (retaining access); the removed project creator (losing access).
**Preconditions:** A project has a recorded creator who is a QA Tester; that creator is removed from the project or from the organisation.
**Main Behaviour:** System revokes only the removed creator's project access; all other members' access, including Admin's and QA Manager's organisation-wide visibility (FR-PRJ-004), is unaffected.
**Business Rules:** PD-032. See also FR-PRJ-007.
**Acceptance Criteria:** Given a project created by a QA Tester who is later removed from the organisation, When the removal takes effect, Then Admin and QA Manager retain their existing access to that project and only the removed creator loses access.
**Error/Edge Conditions:** If the removed creator was the only QA Tester with access to a project not otherwise visible to QA Managers/Admins by default, project visibility for QA Managers/Admins is unaffected since they see all organisation projects (FR-PRJ-004).
**Priority:** MVP
**Dependencies:** FR-PRJ-004, FR-PRJ-007, FR-USR-005

### FR-USR-005 — Remove Organisation Member
**Requirement:** The system shall allow Admin to remove an organisation member, subject to the minimum-one-Admin rule (FR-ORG-006).
**Purpose:** Standard offboarding capability.
**Actors:** Admin.
**Preconditions:** Actor holds Admin role.
**Main Behaviour:** Admin removes a member; member loses organisation and project access per FR-USR-004.
**Business Rules:** PD-030, PD-032.
**Acceptance Criteria:** Given an Admin, When they remove a non-last-Admin member, Then that member loses organisation access.
**Error/Edge Conditions:** Removal of the last Admin is blocked (FR-ORG-006).
**Priority:** MVP
**Dependencies:** FR-ORG-006, FR-USR-004

### FR-USR-006 — View Organisation Member List
**Requirement:** The system shall allow Admin and QA Manager to view the list of organisation members and their roles.
**Purpose:** Supports member/role management.
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** Member list with roles is displayed.
**Business Rules:** None beyond role restriction on viewing.
**Acceptance Criteria:** Given an Admin or QA Manager, When they open the member list, Then all organisation members and their roles are shown.
**Error/Edge Conditions:** QA Tester access to this view: not yet decided (see Open Questions).
**Priority:** MVP
**Dependencies:** FR-USR-001

### FR-USR-007 — QA Tester Project Membership Management
**Requirement:** The system shall allow a QA Tester with access to a project to add other organisation members to that project, or remove their access, and to generate temporary access links.
**Purpose:** Lets QA Testers manage collaborators on projects they work in without requiring Admin/QA Manager involvement for routine access changes.
**Actors:** QA Tester.
**Preconditions:** QA Tester has access to the project.
**Main Behaviour:** QA Tester adds/removes another organisation member's access to that project, or generates a link for BA/PO, Developer, or Stakeholder.
**Business Rules:** PD-017. This is an access grant only, governed by FR-USR-002.
**Acceptance Criteria:** Given a QA Tester with project access, When they add another organisation member to the project, Then that member gains access to the project per their existing organisation role.
**Error/Edge Conditions:** QA Tester cannot grant access to a project they do not themselves have access to.
**Priority:** MVP
**Dependencies:** FR-USR-002, FR-PRJ-005, FR-LNK-001

---

# PRJ — Project Management

### FR-PRJ-001 — Create Project
**Requirement:** The system shall allow Admin, QA Manager, or QA Tester to create a project within their organisation.
**Purpose:** Enables any working role to start new project-scoped work.
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** Organisation has an active trial or paid subscription (FR-SUB-002).
**Main Behaviour:** User creates a project with a name and initial settings.
**Business Rules:** PD-014.
**Acceptance Criteria:** Given an active subscription, When a QA Tester creates a project, Then the project exists and the creator has access to it.
**Error/Edge Conditions:** Blocked entirely if no active trial/subscription (FR-SUB-002).
**Priority:** MVP
**Dependencies:** FR-SUB-002

### FR-PRJ-002 — Update Project
**Requirement:** The system shall allow Admin, QA Manager, or QA Tester (with access) to update project details.
**Purpose:** Keeps project metadata current.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project.
**Main Behaviour:** Actor edits project fields.
**Business Rules:** PD-014.
**Acceptance Criteria:** Given a QA Tester with project access, When they update the project name, Then the change is saved.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-PRJ-003 — Archive Project
**Requirement:** The system shall allow Admin, QA Manager, or QA Tester (with access) to archive a project.
**Purpose:** Retires a project without deleting its history.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project.
**Main Behaviour:** Project is marked archived; historical data is preserved, read-only.
**Business Rules:** PD-014. Deletion of projects with history is restricted; archiving is used instead.
**Acceptance Criteria:** Given a project with access, When it is archived, Then it becomes read-only and no longer accepts new work.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-PRJ-004 — Project Visibility by Role
**Requirement:** The system shall show Admin and QA Manager all projects within their organisation, and shall show QA Tester only projects they created or were added to.
**Purpose:** Preserves oversight visibility for Admin/QA Manager while keeping QA Testers focused on relevant projects.
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** None.
**Main Behaviour:** Project list is filtered per the visibility rule above.
**Business Rules:** PD-014, PD-017.
**Acceptance Criteria:** Given a QA Tester not added to a given project, When they view the project list, Then that project does not appear.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-PRJ-005 — Add User to Project
**Requirement:** The system shall allow Admin, QA Manager, or any QA Tester with access to a project to add another organisation member to that project.
**Purpose:** Grants project-scoped access without a separate role assignment.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project; added user is an organisation member.
**Main Behaviour:** Added user gains project access per their existing organisation role.
**Business Rules:** PD-017.
**Acceptance Criteria:** Given a QA Tester with project access, When they add another QA Tester to the project, Then the added user can see and work in the project.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-002

### FR-PRJ-006 — Remove User from Project
**Requirement:** The system shall allow Admin, QA Manager, or any QA Tester with access to a project to remove another organisation member's access to that project.
**Purpose:** Standard project-level offboarding.
**Actors:** Admin, QA Manager, QA Tester (with access).
**Preconditions:** Actor has access to the project.
**Main Behaviour:** Removed user loses access to that specific project only (organisation membership unaffected).
**Business Rules:** PD-017. See FR-PRJ-007 for the project-creator special case.
**Acceptance Criteria:** Given a QA Tester with project access, When they remove another member's project access, Then that member can no longer see or act on the project.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-005

### FR-PRJ-007 — Removed Project Creator — Admin/QA Manager Access Retained **[Updated]**
**Requirement:** The system shall ensure that when a project's creator is removed from the project (via FR-PRJ-006) or loses organisation access (via FR-USR-005), Admin and QA Manager retain whatever access to that project they already had; only the removed creator's access is revoked.
**Purpose:** The creator leaving should not disrupt other members' or Admin's/QA Manager's standing access (PD-032).
**Actors:** Admin, QA Manager (retaining access); removed project creator (losing access).
**Preconditions:** A project creator (QA Tester) is removed from the project or the organisation.
**Main Behaviour:** Only the removed creator's project access is revoked; all other access, including Admin's/QA Manager's default organisation-wide project visibility, is unchanged.
**Business Rules:** PD-032.
**Acceptance Criteria:** Given a project created by a QA Tester, When that QA Tester is removed from the project, Then Admin and QA Manager (and any other project members) retain their access and only the creator loses it.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-USR-004, FR-PRJ-004

---

# REQ — Requirements Management

### FR-REQ-001 — Native Requirement Authoring
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to natively author a requirement.
**Purpose:** Captures the requirement as the basis for test case creation.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Actor creates a requirement record, typically sourced from an external record (e.g., a Jira ticket).
**Business Rules:** PD-015. BA/PO does not author requirements.
**Acceptance Criteria:** Given a QA Tester with project access, When they create a requirement, Then it is saved and available for linking to test cases.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-PRJ-001

### FR-REQ-002 — Editing a Linked Requirement Triggers Re-Review **[Updated]**
**Requirement:** The system shall, when a requirement that has one or more linked and already-Approved test cases is edited, set the status of each such linked, Approved test case to "Needs Review."
**Purpose:** Ensures a change to a requirement's content cannot silently leave stale, already-approved test cases in place without a fresh review (PD-033).
**Actors:** QA Tester, QA Manager, Admin (editing the requirement); QA Manager or test case creator (performing the resulting re-review, per FR-TC-005).
**Preconditions:** The requirement being edited has at least one linked test case currently in "Approved" status.
**Main Behaviour:** On save of the requirement edit, every linked test case in "Approved" status transitions to "Needs Review." Linked test cases not currently Approved (e.g., Draft, Pending Approval) are unaffected.
**Business Rules:** PD-033. Re-approval follows the same path as FR-TC-005 — QA Manager approval where the project's workflow has approval enabled, or self-approval by the test case creator where it does not.
**Acceptance Criteria:** Given a requirement with an Approved, linked test case, When the requirement is edited and saved, Then that test case's status changes to "Needs Review."
**Error/Edge Conditions:** Editing a requirement with no linked test cases, or only linked test cases not in Approved status, triggers no status change.
**Priority:** MVP
**Dependencies:** FR-TC-005, FR-REQ-003

### FR-REQ-003 — Optional Requirement–Test-Case Link
**Requirement:** The system shall allow a test case to optionally link to a requirement; linkage is not mandatory.
**Purpose:** Supports exploratory testing while preserving traceability value where links exist.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Test case may be created/edited with or without a requirement link.
**Business Rules:** PD-005.
**Acceptance Criteria:** Given a test case with no requirement link, When it is saved, Then it is accepted and reported as "untraced."
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TRACE-002

### FR-REQ-004 — Requirement Archive Cascade, Including Active Test Runs **[Updated]**
**Requirement:** The system shall, when a requirement is archived, cascade-archive all test cases and test reports linked to that requirement. If any linked test case is currently part of an active, unclosed test run, that test run shall also be cancelled and archived as part of the same cascade.
**Purpose:** Keeps traceability consistent — a requirement no longer in active use shouldn't leave orphaned active test cases, reports, or in-flight test runs (PD-016, extended by PD-034).
**Actors:** QA Tester, QA Manager, Admin (archiving the requirement).
**Preconditions:** Requirement has at least one linked test case, report, or active test run.
**Main Behaviour:** Archiving the requirement archives its linked test cases and reports. Any linked test case belonging to an active, unclosed test run causes that test run to be cancelled and archived as well.
**Business Rules:** PD-016, PD-034.
**Acceptance Criteria:**
- Given a requirement with linked test cases and reports, When it is archived, Then those test cases and reports are also archived.
- Given a requirement with a linked test case that is part of an active, unclosed test run, When the requirement is archived, Then that test run is cancelled and archived along with the requirement, its test cases, and its reports.
**Error/Edge Conditions:** A test run already closed at the time of archiving is left as-is (closed runs are historical and are not further modified — see FR-EXEC-003).
**Priority:** MVP
**Dependencies:** FR-TR-003, FR-EXEC-003, FR-RPT-001

---

# TC — Test Case Management

### FR-TC-001 — Create Test Case
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to create a test case, manually or via AI generation.
**Purpose:** Core authoring capability.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Actor creates a test case with steps and expected results.
**Business Rules:** None beyond standard authoring.
**Acceptance Criteria:** Given project access, When a test case is created, Then it is saved in "Draft" status (see FR-TC-005).
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-005

### FR-TC-002 — Edit Test Case
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin (with project access) to edit an existing test case.
**Purpose:** Keeps test cases current.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Test case content is updated; a new version is recorded (FR-TC-003).
**Business Rules:** Editing an Approved test case reverts it to Pending Approval, or to Needs Review if the edit follows a requirement change (FR-TC-005, FR-REQ-002).
**Acceptance Criteria:** Given an Approved test case, When it is edited, Then its status reverts per FR-TC-005.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-003, FR-TC-005

### FR-TC-003 — Test Case Versioning
**Requirement:** The system shall version test cases such that each edit is recorded and a test run preserves a snapshot of the test case content at execution time.
**Purpose:** Preserves historical accuracy of what was actually tested.
**Actors:** N/A (system behaviour).
**Preconditions:** Test case has been edited or included in a test run.
**Main Behaviour:** Each save creates a new version; test runs reference a snapshot, not the live test case.
**Business Rules:** None beyond the versioning/snapshot principle.
**Acceptance Criteria:** Given a test case included in a closed test run, When the live test case is later edited, Then the closed run's recorded content is unchanged.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-002

### FR-TC-004 — Test Run Snapshot of Test Case Content
**Requirement:** The system shall capture a snapshot of each test case's content at the moment a test run is created, and shall use that snapshot, not the live test case, for execution within that run.
**Purpose:** Ensures execution results are traceable to the exact content tested.
**Actors:** N/A (system behaviour).
**Preconditions:** A test run is being created.
**Main Behaviour:** Snapshot is taken at run creation and stored with the run.
**Business Rules:** None beyond the snapshot principle.
**Acceptance Criteria:** Given a test run created from a test case, When the test case is later edited, Then the run continues to display the snapshot as it existed at run creation.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-001, FR-TC-003

### FR-TC-005 — Test Case Status Model, Approval, and Self-Approval **[Updated]**
**Requirement:** The system shall maintain a test case status of Draft, Pending Approval, Approved, or Needs Review. Where a project's QA workflow has approval enabled, a test case moves from Pending Approval to Approved only via QA Manager approval, and from Pending Approval to Needs Review via QA Manager rejection. Where a project's QA workflow does not have approval enabled, the test case's creator may set its own status directly to Approved.
**Purpose:** Reflects the configurable QA approval workflow (PD-006), the rejection outcome (PD-035), and the no-approval-step self-approval path (PD-036).
**Actors:** QA Tester (creator, submitter, self-approver where applicable), QA Manager (approver/rejector where approval is enabled).
**Preconditions:** Project's QA workflow configuration (approval enabled or not) is known.
**Main Behaviour:**
- Approval-enabled project: Draft → Pending Approval (on submission) → Approved (QA Manager approves) or Needs Review (QA Manager rejects).
- No-approval-step project: Draft → Approved (creator self-approves directly; no Pending Approval stage is required).
- A Needs Review test case is edited/addressed by its creator and resubmitted to Pending Approval.
- An Approved test case that is edited reverts to Pending Approval (approval-enabled projects) — see FR-TC-002.
- An Approved test case affected by a linked requirement edit reverts to Needs Review — see FR-REQ-002.
**Business Rules:** PD-006, PD-007, PD-035, PD-036.
**Acceptance Criteria:**
- Given a project with approval enabled, When a QA Manager rejects a Pending Approval test case, Then its status becomes Needs Review.
- Given a project without approval enabled, When the test case's creator sets it to Approved, Then the status change succeeds without QA Manager action.
- Given a project without approval enabled, When any user other than the test case's creator attempts to set it to Approved, Then the system's behaviour follows standard project-access permissions (self-approval is scoped to the creator).
**Error/Edge Conditions:** A test case already Approved, in a project that later has approval enabled or disabled, is not retroactively changed by the workflow-setting change alone (see Open Questions for the case where a Needs Review test case's project subsequently disables approval).
**Priority:** MVP
**Dependencies:** FR-TC-002, FR-REQ-002

### FR-TC-006 — Optional Requirement Linkage
**Requirement:** The system shall allow a test case to be created and saved without a linked requirement.
**Purpose:** Duplicate of the business rule in FR-REQ-003, stated from the test case side for module completeness.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Requirement link field is optional on the test case.
**Business Rules:** PD-005.
**Acceptance Criteria:** Given a test case being saved with no requirement link, When saved, Then it is accepted.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-REQ-003

### FR-TC-007 — Review and Comment on Test Cases
**Requirement:** The system shall allow QA Manager to review and comment on a test case.
**Purpose:** Supports the approval workflow with feedback.
**Actors:** QA Manager.
**Preconditions:** Test case exists in the project.
**Main Behaviour:** QA Manager adds comments visible to the test case's creator.
**Business Rules:** None beyond PD-006.
**Acceptance Criteria:** Given a Pending Approval test case, When a QA Manager adds a comment, Then it is visible to the test case's creator.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-005

### FR-TC-008 — Test Case Template Application
**Requirement:** The system shall allow a test case to be created from an organisation-scoped test case template.
**Purpose:** Speeds up authoring with a consistent structure.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** At least one test case template exists in the organisation.
**Main Behaviour:** Actor selects a template when creating a test case; template fields pre-populate.
**Business Rules:** PD-009 (organisation-scoped templates).
**Acceptance Criteria:** Given an existing template, When a user creates a test case from it, Then the new test case is pre-populated per the template.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-TC-009 — Assign Test Case to Suite
**Requirement:** The system shall allow a test case to be organized into one or more test suites.
**Purpose:** Enables grouping for execution and reporting.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Test case and suite exist in the same project.
**Main Behaviour:** Actor assigns a test case to a suite.
**Business Rules:** None beyond project scoping.
**Acceptance Criteria:** Given a test case and a suite in the same project, When the test case is assigned, Then it appears within that suite.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TS-001

### FR-TC-010 — AI-Generated Test Case Flagging
**Requirement:** The system shall flag a test case as AI-generated when created via AI generation, distinguishing it from manually authored test cases.
**Purpose:** Preserves visibility into which test cases originated from AI generation.
**Actors:** N/A (system behaviour).
**Preconditions:** Test case created via FR-AI-001.
**Main Behaviour:** AI-generated flag is set at creation and persists through edits.
**Business Rules:** None beyond FR-AI-002 (mandatory human review before save).
**Acceptance Criteria:** Given a test case generated by AI, When it is saved, Then it is flagged as AI-generated.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AI-001, FR-AI-002

---

# AI — AI Test Generation

### FR-AI-001 — Generate Test Cases from Requirement
**Requirement:** The system shall generate a full set of test cases from a selected requirement using AI.
**Purpose:** Reduces manual test case authoring effort.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** A requirement exists; AI is available (platform-provided or project key, FR-AI-003/FR-AI-004).
**Main Behaviour:** Actor triggers generation; system produces a set of draft test cases linked to the requirement.
**Business Rules:** None beyond PD-008.
**Acceptance Criteria:** Given a requirement, When AI generation is triggered, Then a set of draft test cases linked to that requirement is produced.
**Error/Edge Conditions:** AI provider failure surfaces an error; no partial/corrupted test cases are saved.
**Priority:** MVP
**Dependencies:** FR-REQ-001, FR-AI-002

### FR-AI-002 — Mandatory Human Review Before Save
**Requirement:** The system shall require AI-generated test cases to be reviewed and be editable before being saved as final.
**Purpose:** Keeps humans in control of quality decisions (vision principle).
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** AI generation has produced draft test cases.
**Main Behaviour:** Draft test cases are presented for review/edit prior to save.
**Business Rules:** Vision Product Principle: AI accelerates but never replaces human review.
**Acceptance Criteria:** Given AI-generated drafts, When the user attempts to save without opening the review step, Then the system still requires the review/edit step to complete before final save.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AI-001

### FR-AI-003 — Optional Per-Project AI Provider Key
**Requirement:** The system shall allow a project to optionally configure its own AI provider key.
**Purpose:** Lets teams use their own AI provider account.
**Actors:** QA Manager, Admin.
**Preconditions:** Project exists.
**Main Behaviour:** Provider key is configured at the project level and used for that project's AI generation.
**Business Rules:** PD-008.
**Acceptance Criteria:** Given a project with a configured key, When AI generation runs, Then the project's key is used.
**Error/Edge Conditions:** Invalid key surfaces a configuration error.
**Priority:** MVP
**Dependencies:** None

### FR-AI-004 — Platform-Provided AI Option
**Requirement:** The system shall provide a platform-provided AI option usable without project-level key configuration.
**Purpose:** Lowers the barrier to trying AI features.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** Project without a configured key uses the platform-provided AI option by default.
**Business Rules:** PD-008. Usage limits/cost model: not yet decided.
**Acceptance Criteria:** Given a project with no configured key, When AI generation is triggered, Then the platform-provided option is used.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-AI-005 — AI Generation Scope Limited to Requirements
**Requirement:** The system shall support AI generation of test cases from a selected requirement only; generation from free-text task descriptions is out of scope for MVP.
**Purpose:** Keeps MVP AI scope focused.
**Actors:** N/A (scope boundary).
**Preconditions:** None.
**Main Behaviour:** Generation entry point requires a selected requirement.
**Business Rules:** Vision Current Scope Boundaries; PRD Non-Goals.
**Acceptance Criteria:** Given no requirement selected, When a user looks for a generation option, Then no free-text generation entry point is presented.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-REQ-001

---

# TS — Test Suite Management

### FR-TS-001 — Create Test Suite
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to create a test suite within a project.
**Purpose:** Groups related test cases.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access.
**Main Behaviour:** Actor creates a named suite.
**Business Rules:** None.
**Acceptance Criteria:** Given project access, When a suite is created, Then it is available for test case assignment.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-TS-002 — Organize Test Cases into Suite
**Requirement:** See FR-TC-009 (test case side of the same capability).
**Purpose:** N/A — cross-reference entry.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** N/A.
**Main Behaviour:** N/A.
**Business Rules:** N/A.
**Acceptance Criteria:** N/A.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-009

---

# TR — Test Run / Execution

### FR-TR-001 — Create Test Run
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to create a test run from one or more test cases or a suite.
**Purpose:** Starting point for executing tests.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Actor has project access; at least one test case is selected.
**Main Behaviour:** Actor creates a run; system snapshots selected test case content (FR-TC-004).
**Business Rules:** None beyond the snapshot rule.
**Acceptance Criteria:** Given selected test cases, When a run is created, Then a snapshot is taken and the run is ready for execution.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-004

### FR-TR-002 — Snapshot Test Case Content at Run Creation
**Requirement:** See FR-TC-004 (system-behaviour duplicate, stated from the run side for module completeness).
**Purpose:** N/A — cross-reference entry.
**Actors:** N/A.
**Preconditions:** N/A.
**Main Behaviour:** N/A.
**Business Rules:** N/A.
**Acceptance Criteria:** N/A.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TC-004

### FR-TR-003 — Close Test Run
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to close a test run once execution is complete, and shall allow a test run to be cancelled and archived as part of a requirement archive cascade (FR-REQ-004).
**Purpose:** Finalizes a run's results.
**Actors:** QA Tester, QA Manager, Admin (manual close); system (cascade cancellation).
**Preconditions:** Run exists and is not already closed.
**Main Behaviour:** Run transitions to Closed; results become immutable (FR-EXEC-003). A cascade-triggered cancellation archives the run instead of a normal close.
**Business Rules:** PD-034 (cascade cancellation); FR-EXEC-003 (post-closure immutability).
**Acceptance Criteria:** Given an open run with recorded results, When it is closed, Then its results become immutable.
**Error/Edge Conditions:** A run already closed cannot be closed again; a cascade-cancelled run is marked distinctly from a normally closed run (exact status label: see Open Questions).
**Priority:** MVP
**Dependencies:** FR-EXEC-003, FR-REQ-004

### FR-TR-004 — Test Run Progress Aggregation
**Requirement:** The system shall display aggregate progress counts (e.g., Pass/Fail/Blocked/Skipped totals) for an in-progress test run.
**Purpose:** Supports real-time QA decision-making.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Run has at least one recorded result.
**Main Behaviour:** Progress counts update as results are recorded.
**Business Rules:** None.
**Acceptance Criteria:** Given a run with recorded results, When the run is viewed, Then current progress counts are displayed.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-EXEC-001

---

# EXEC — Test Execution

### FR-EXEC-001 — Record Execution Result
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to record an execution result (Pass, Fail, Blocked, or Skipped) for each test case in an open test run.
**Purpose:** Core execution recording capability.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Run is open (not closed).
**Main Behaviour:** Actor records a status per test case in the run.
**Business Rules:** None beyond the fixed status set.
**Acceptance Criteria:** Given an open run, When a result is recorded, Then it is saved against that test case's snapshot within the run.
**Error/Edge Conditions:** Attempting to record a result on a closed run is rejected (FR-EXEC-003).
**Priority:** MVP
**Dependencies:** FR-TR-001

### FR-EXEC-002 — Attach Evidence to Result
**Requirement:** The system shall allow evidence (e.g., a file or note) to be attached to a recorded execution result.
**Purpose:** Supports defect investigation and audit.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** A result has been recorded.
**Main Behaviour:** Actor attaches evidence to the result.
**Business Rules:** None.
**Acceptance Criteria:** Given a recorded result, When evidence is attached, Then it is stored with that result.
**Error/Edge Conditions:** Evidence cannot be attached after run closure (FR-EXEC-003).
**Priority:** MVP
**Dependencies:** FR-EXEC-001

### FR-EXEC-003 — Execution Result Immutability After Run Closure **[Updated]**
**Requirement:** The system shall not permit any recorded execution result within a test run to be edited, added, or removed once that test run has been closed. This is a hard rule with no exception.
**Purpose:** Preserves the integrity of historical execution records once a run is finalized (PD-037).
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** Test run is in Closed status.
**Main Behaviour:** Any attempt to modify a result, or attach/remove evidence, on a closed run is rejected outright.
**Business Rules:** PD-037. Supersedes any prior "not specified" framing of post-closure editability.
**Acceptance Criteria:** Given a closed test run, When any user attempts to edit a recorded result, Then the system rejects the change and the result remains as it was at closure.
**Error/Edge Conditions:** A cascade-cancelled-and-archived run (FR-REQ-004) is treated the same as a normally closed run for this immutability rule.
**Priority:** MVP
**Dependencies:** FR-TR-003

---

# DEF — Defect Management

### FR-DEF-001 — Log Defect
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin to log a defect from a failed execution result.
**Purpose:** Captures issues found during testing.
**Actors:** QA Tester, QA Manager, Admin.
**Preconditions:** A Fail result exists.
**Main Behaviour:** Actor logs a defect linked to the failed result.
**Business Rules:** None.
**Acceptance Criteria:** Given a Fail result, When a defect is logged, Then it is linked to that result and its test case.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-EXEC-001

### FR-DEF-002 — Assign Defect to Developer
**Requirement:** The system shall allow a logged defect to be assigned to a Developer via a temporary access link.
**Purpose:** Routes the defect to the responsible party.
**Actors:** QA Tester, QA Manager, Admin (assigning); Developer (recipient, link-based).
**Preconditions:** Defect exists.
**Main Behaviour:** Assignment generates a scoped link (FR-LNK-001) sent to the Developer.
**Business Rules:** PD-018.
**Acceptance Criteria:** Given a logged defect, When it is assigned to a Developer, Then a scoped link is generated and delivered.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-DEF-006

### FR-DEF-003 — Update Defect Status via Link
**Requirement:** The system shall allow a Developer, via their access link, to update the status of the defect assigned to them.
**Purpose:** Lets Developers report progress without organisation membership.
**Actors:** Developer (via link).
**Preconditions:** Valid, unexpired link.
**Main Behaviour:** Developer updates defect status through the scoped link.
**Business Rules:** PD-018. Link has no identity verification (FR-LNK-002).
**Acceptance Criteria:** Given a valid link, When the Developer updates status, Then the change is recorded and attributed to the link/action.
**Error/Edge Conditions:** Expired or revoked link rejects the update.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-LNK-002

### FR-DEF-004 — Link Defect to Test Case/Result
**Requirement:** The system shall maintain a link between a defect and the test case/result it originated from.
**Purpose:** Supports traceability.
**Actors:** N/A (system behaviour).
**Preconditions:** Defect logged from a result.
**Main Behaviour:** Link persists for the defect's lifetime.
**Business Rules:** None.
**Acceptance Criteria:** Given a logged defect, When its origin is viewed, Then the linked test case and result are shown.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-DEF-001, FR-TRACE-001

### FR-DEF-005 — Defect History
**Requirement:** The system shall record a history of status changes and actions on a defect.
**Purpose:** Supports audit and progress tracking.
**Actors:** N/A (system behaviour).
**Preconditions:** Defect exists.
**Main Behaviour:** Each status change is timestamped and attributed.
**Business Rules:** All significant actions, including link-based ones, must be attributed and timestamped.
**Acceptance Criteria:** Given a defect with status changes, When its history is viewed, Then all changes are listed with timestamp and attribution.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-002

### FR-DEF-006 — Notify Developer of Defect Assignment
**Requirement:** The system shall notify the assigned Developer, via email carrying their access link, when a defect is assigned to them.
**Purpose:** Delivers both notice and access in one step for a non-account role.
**Actors:** Developer (recipient).
**Preconditions:** Defect assigned (FR-DEF-002).
**Main Behaviour:** Email sent immediately on assignment.
**Business Rules:** PD-010, PD-018. Email is the sole delivery/access mechanism for link-based roles (FR-NOT-003).
**Acceptance Criteria:** Given a defect assignment, When it is saved, Then an email with the access link is sent to the Developer.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-003, FR-NOT-005

---

# TRACE — Traceability

### FR-TRACE-001 — Requirement-to-Defect Traceability Chain
**Requirement:** The system shall maintain traceability across the chain requirement → test case(s) → run(s) → result(s) → defect(s) wherever links exist.
**Purpose:** Core traceability value proposition.
**Actors:** N/A (system behaviour).
**Preconditions:** Links exist along the chain.
**Main Behaviour:** Each entity retains references to its upstream/downstream linked entities.
**Business Rules:** None beyond "wherever links exist" (linkage itself is often optional, e.g., FR-REQ-003).
**Acceptance Criteria:** Given a fully linked chain, When any entity in the chain is viewed, Then its related upstream/downstream entities are navigable.
**Error/Edge Conditions:** A break in the chain (e.g., untraced test case) simply stops traceability at that point; it is not an error state.
**Priority:** MVP
**Dependencies:** FR-REQ-003, FR-DEF-004

### FR-TRACE-002 — Traced vs. Untraced Test Case Reporting
**Requirement:** The system shall distinguish traced (requirement-linked) from untraced test cases in reporting.
**Purpose:** Supports the optional-linkage model without losing reporting clarity.
**Actors:** N/A (system behaviour).
**Preconditions:** None.
**Main Behaviour:** Reports/dashboards label test cases as traced or untraced.
**Business Rules:** PD-005.
**Acceptance Criteria:** Given a mix of traced and untraced test cases, When a report is generated, Then each is labelled accordingly.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-REQ-003, FR-RPT-001

---

# RPT — Reporting

### FR-RPT-001 — On-Demand Report Generation
**Requirement:** The system shall allow QA Manager or Admin to generate a report on demand for a project.
**Purpose:** Supports reporting to stakeholders and BA/PO.
**Actors:** QA Manager, Admin.
**Preconditions:** Project has execution data.
**Main Behaviour:** Actor triggers generation; system compiles current data into a report.
**Business Rules:** Reporting is on-demand only in MVP; scheduled/automated distribution is postponed.
**Acceptance Criteria:** Given a project with execution data, When a report is generated, Then it reflects current data at generation time.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-RPT-002

### FR-RPT-002 — Single Report Type with Post-Deployment Section **[Updated]**
**Requirement:** The system shall generate a single report type per project (not separate "pre-deployment" and "post-deployment" report types). This single report shall include a "Post-Deployment" section that specifically covers testing performed in production.
**Purpose:** Simplifies the reporting model to one report whose scope can span pre- and post-deployment testing activity, rather than maintaining two distinct report artifacts (PD-038).
**Actors:** QA Manager, Admin (generation); BA/PO (review via link).
**Preconditions:** None.
**Main Behaviour:** Report generation produces one report document/view; if production testing data exists, the Post-Deployment section is populated within that same report.
**Business Rules:** PD-038. **This decision supersedes any earlier framing of "pre-deployment report" and "post-deployment report" as two distinct report types — they are sections/scope within one report.**
**Acceptance Criteria:** Given a project with both pre-release and production testing activity, When a report is generated, Then both are represented within one report, with production testing appearing in its Post-Deployment section.
**Error/Edge Conditions:** A project with no production testing activity yet still generates the single report, with an empty/not-applicable Post-Deployment section.
**Priority:** MVP
**Dependencies:** FR-RPT-001

### FR-RPT-003 — BA/PO Report Approval/Rejection — Record-Keeping Only **[Updated]**
**Requirement:** The system shall allow BA/PO, via their access link, to approve or reject a report. This approval or rejection shall be recorded but shall not trigger, gate, or block any other action or workflow in the system.
**Purpose:** Gives BA/PO a formal sign-off record without coupling report review to release or workflow gating logic not otherwise approved (PD-039).
**Actors:** BA/PO (via link).
**Preconditions:** Valid, unexpired link scoped to report approval.
**Main Behaviour:** BA/PO records an approve/reject decision on the report; decision and timestamp are stored.
**Business Rules:** PD-039. Explicitly not a gate: no downstream action (e.g., release, workflow state) depends on this decision.
**Acceptance Criteria:** Given a valid link, When BA/PO approves or rejects the report, Then the decision is recorded and no other system action is triggered as a result.
**Error/Edge Conditions:** Expired/revoked link rejects the action.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-RPT-002

### FR-RPT-004 — BA/PO Report Comments — Private to QA Tester **[New]**
**Requirement:** The system shall allow BA/PO, via their access link, to leave comments on a report. These comments shall be visible only to the QA Tester and shall not be included in the report itself.
**Purpose:** Gives BA/PO a private feedback channel to the QA Tester, separate from the formal report content and from the record-only approval decision (PD-040).
**Actors:** BA/PO (via link, commenting); QA Tester (sole viewer of comments).
**Preconditions:** Valid, unexpired link scoped to the report.
**Main Behaviour:** BA/PO adds a comment associated with the report; comment is stored separately from report content and surfaced only to the QA Tester(s) associated with that project/report.
**Business Rules:** PD-040. Comments are not visible to QA Manager, Admin, Developer, or Stakeholder, and are excluded from the report document/view itself.
**Acceptance Criteria:** Given a valid report link, When BA/PO adds a comment, Then it appears to the QA Tester but does not appear within the report content, and is not visible to other roles.
**Error/Edge Conditions:** Expired/revoked link rejects new comments; existing comments remain visible to the QA Tester.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-RPT-002

---

# DASH — Dashboards

### FR-DASH-001 — Project Progress Dashboard
**Requirement:** The system shall provide a project-level dashboard showing testing progress.
**Purpose:** Central visibility for QA Manager/Admin.
**Actors:** QA Manager, Admin.
**Preconditions:** Project has activity.
**Main Behaviour:** Dashboard aggregates run/result/defect data for the project.
**Business Rules:** None.
**Acceptance Criteria:** Given a project with activity, When the dashboard is viewed, Then current progress is shown.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-004

### FR-DASH-002 — Test Run Progress Widget
**Requirement:** See FR-TR-004 (dashboard-facing view of the same underlying data).
**Purpose:** N/A — cross-reference entry.
**Actors:** QA Manager, Admin, QA Tester.
**Preconditions:** N/A.
**Main Behaviour:** N/A.
**Business Rules:** N/A.
**Acceptance Criteria:** N/A.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-TR-004

### FR-DASH-003 — Stakeholder Read-Only Dashboard View
**Requirement:** The system shall allow a Stakeholder, via their access link, to view a read-only dashboard or report.
**Purpose:** Gives external stakeholders visibility without organisation membership.
**Actors:** Stakeholder (via link).
**Preconditions:** Valid, unexpired link.
**Main Behaviour:** Stakeholder views dashboard/report data; no edit capability.
**Business Rules:** PD-018.
**Acceptance Criteria:** Given a valid link, When a Stakeholder opens it, Then they see read-only dashboard/report data.
**Error/Edge Conditions:** Expired/revoked link denies access.
**Priority:** MVP
**Dependencies:** FR-LNK-001

---

# AUD — Audit / History

### FR-AUD-001 — Audit Log of Key Actions
**Requirement:** The system shall maintain an audit log of key actions across projects (e.g., approvals, archiving, role changes, defect status changes).
**Purpose:** Supports accountability and traceability of significant actions.
**Actors:** N/A (system behaviour).
**Preconditions:** A key action occurs.
**Main Behaviour:** Each key action creates an audit entry.
**Business Rules:** None beyond "key actions" scope, which includes at minimum: role changes (FR-USR-003), member removal (FR-USR-005), project archive (FR-PRJ-003), requirement archive cascade (FR-REQ-004), test case approval/rejection (FR-TC-005), and defect status changes (FR-DEF-003).
**Acceptance Criteria:** Given a key action, When it occurs, Then an audit entry is created.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-004

### FR-AUD-002 — Audit Entries for Link-Based Actions
**Requirement:** The system shall record audit entries for actions performed via a temporary access link (e.g., defect status update, report approval/rejection).
**Purpose:** Preserves accountability even for non-account, link-based actors.
**Actors:** N/A (system behaviour).
**Preconditions:** A link-based action occurs.
**Main Behaviour:** Audit entry records the action, the link/role it was performed through, and timestamp.
**Business Rules:** Because links have no identity verification (FR-LNK-002), the audit entry identifies the link/role used, not a verified individual identity.
**Acceptance Criteria:** Given a link-based defect status update, When it occurs, Then an audit entry is recorded reflecting the link/role and timestamp.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-002

### FR-AUD-003 — Audit History Visibility Restricted to QA Manager/Admin **[Updated]**
**Requirement:** The system shall restrict visibility of audit history to users holding the QA Manager or Admin role. QA Tester and all link-based roles (BA/PO, Developer, Stakeholder) shall not be able to view audit history.
**Purpose:** Keeps the full action history — including sensitive actions like role changes and removals — restricted to the roles responsible for organisation/project oversight (PD-041).
**Actors:** QA Manager, Admin (viewers); QA Tester and link-based roles (excluded).
**Preconditions:** Audit entries exist.
**Main Behaviour:** Audit history view/query is only accessible to QA Manager and Admin.
**Business Rules:** PD-041.
**Acceptance Criteria:**
- Given a QA Manager or Admin, When they open audit history, Then they can view it.
- Given a QA Tester or a link-based role, When they attempt to access audit history, Then access is denied.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-AUD-001

### FR-AUD-004 — Audit Entry Attribution and Timestamping
**Requirement:** The system shall attribute and timestamp every audit entry.
**Purpose:** Ensures audit entries are meaningful and traceable.
**Actors:** N/A (system behaviour).
**Preconditions:** An audit entry is created.
**Main Behaviour:** Entry records actor (user or link/role) and timestamp.
**Business Rules:** All significant actions must be attributed and timestamped.
**Acceptance Criteria:** Given any audit entry, When viewed, Then it shows who (or which link/role) performed it and when.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

---

# NOT — Notifications

### FR-NOT-001 — In-App Notifications for Organisation Members
**Requirement:** The system shall deliver in-app notifications to organisation members for key events (e.g., invitation, approval request, defect assignment).
**Purpose:** Timely handoff between roles.
**Actors:** Admin, QA Manager, QA Tester.
**Preconditions:** A notifiable event occurs.
**Main Behaviour:** In-app notification is created for the relevant member(s).
**Business Rules:** PD-010.
**Acceptance Criteria:** Given a notifiable event, When it occurs, Then the relevant organisation member(s) see an in-app notification.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-NOT-002 — Email Notifications for All Roles
**Requirement:** The system shall send email notifications for key events to all roles, including link-based roles.
**Purpose:** Ensures notification reach beyond in-app presence.
**Actors:** All roles.
**Preconditions:** A notifiable event occurs.
**Main Behaviour:** Email is sent in addition to (for organisation members) or instead of (for link-based roles) in-app notification.
**Business Rules:** PD-010.
**Acceptance Criteria:** Given a notifiable event, When it occurs, Then an email is sent to the relevant recipient(s).
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-005

### FR-NOT-003 — Email as Sole Delivery Mechanism for Link-Based Roles
**Requirement:** The system shall use email as the sole delivery mechanism for link-based roles, with the email itself carrying the access link.
**Purpose:** Link-based roles have no account or in-app presence to notify.
**Actors:** BA/PO, Developer, Stakeholder.
**Preconditions:** A link is generated for one of these roles.
**Main Behaviour:** Email containing the link is sent; no in-app notification exists for these roles.
**Business Rules:** PD-010, PD-018.
**Acceptance Criteria:** Given a link generated for a Developer, When it is sent, Then it arrives by email and contains the access link.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-NOT-004 — Maintenance Notification
**Requirement:** The system shall notify Admin and QA Manager at least 24 hours in advance of planned maintenance affecting availability.
**Purpose:** Avoids surprising customers with downtime during active testing cycles.
**Actors:** Admin, QA Manager.
**Preconditions:** Planned maintenance is scheduled.
**Main Behaviour:** Notice is sent at least 24 hours ahead of the maintenance window.
**Business Rules:** None beyond the 24-hour minimum.
**Acceptance Criteria:** Given scheduled maintenance, When the notice is due, Then it is sent at least 24 hours before the window.
**Error/Edge Conditions:** N/A.
**Priority:** Post-MVP
**Dependencies:** None

### FR-NOT-005 — Notification/Link Delivery Retry
**Requirement:** The system shall retry a failed notification email or access link delivery at least once, within 5 minutes of the initial failure, before treating it as a permanent failure.
**Purpose:** Link-based roles depend entirely on email delivery for access; a non-retried failure blocks their ability to work.
**Actors:** N/A (system behaviour).
**Preconditions:** An email send fails.
**Main Behaviour:** System retries at least once within 5 minutes; logs and surfaces a permanent failure to the sender if retry also fails.
**Business Rules:** None beyond the retry minimum.
**Acceptance Criteria:** Given a failed send, When retried within 5 minutes and it succeeds, Then the recipient receives the notification/link.
**Error/Edge Conditions:** Permanent failure after retry is logged and visible to the sender.
**Priority:** MVP
**Dependencies:** None

---

# LNK — Link-Based Access

### FR-LNK-001 — Generate Temporary Access Link, Configurable Expiry **[Updated]**
**Requirement:** The system shall allow QA Tester, QA Manager, or Admin (with project access) to generate a temporary access link scoped to a specific action (e.g., report approval, defect status update, dashboard viewing) for BA/PO, Developer, or Stakeholder. The link's expiry duration shall be configurable by the generator, defaulting to 24 hours if not otherwise specified.
**Purpose:** Provides lightweight, no-account access for external roles, with a bounded and adjustable exposure window (PD-042).
**Actors:** QA Tester, QA Manager, Admin (generating); BA/PO, Developer, Stakeholder (recipient).
**Preconditions:** Generator has project access.
**Main Behaviour:** Generator creates a link scoped to one action/role; optionally sets a custom expiry duration; if none is set, expiry defaults to 24 hours from generation.
**Business Rules:** PD-018, PD-042.
**Acceptance Criteria:**
- Given a generator who specifies no expiry, When the link is created, Then it expires 24 hours after generation.
- Given a generator who specifies a custom expiry duration, When the link is created, Then it expires after that duration instead.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-LNK-002 — No Identity Verification for Link Recipients **[Updated]**
**Requirement:** The system shall not perform formal identity verification of a link recipient. The link itself shall be the sole credential; anyone possessing the link URL can perform the action(s) it scopes, until it expires or is revoked.
**Purpose:** Consistent with the lightweight, no-account access model already approved; mitigated by expiry (FR-LNK-001) and revocability (FR-LNK-005), which are the accepted trade-off controls (PD-043).
**Actors:** BA/PO, Developer, Stakeholder.
**Preconditions:** A link exists and is unexpired/unrevoked.
**Main Behaviour:** Link grants its scoped action to whoever holds the URL, with no login or identity check.
**Business Rules:** PD-043. This is an accepted trade-off, not a gap to be fixed.
**Acceptance Criteria:** Given a valid, unexpired link, When it is opened by anyone holding the URL, Then the scoped action is available without any identity check.
**Error/Edge Conditions:** N/A — absence of identity verification is the specified behaviour, not an error condition.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-LNK-005

### FR-LNK-003 — Named or Generic Link Recipient **[Updated]**
**Requirement:** The system shall support generating a temporary access link either targeted to a named recipient or generic, with no named recipient specified.
**Purpose:** Covers both cases — a link addressed to a specific known person (e.g., a named Developer) and a link meant for whoever needs it (e.g., a generic Stakeholder viewing link) (PD-044).
**Actors:** QA Tester, QA Manager, Admin (generating).
**Preconditions:** Generator has project access.
**Main Behaviour:** At generation, the generator optionally provides a recipient name/identifier; if omitted, the link is generic.
**Business Rules:** PD-044.
**Acceptance Criteria:**
- Given a generator who provides a recipient name, When the link is created, Then it is recorded as targeted to that named recipient.
- Given a generator who provides no recipient name, When the link is created, Then it is recorded as generic.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-LNK-004 — Multi-Use Link Until Expiry or Revocation **[Updated]**
**Requirement:** The system shall allow a temporary access link to be used multiple times, by whoever holds it, until it expires or is revoked. A link shall not be single-use.
**Purpose:** Matches the accepted lightweight access model, where the link (not a per-use token) is the credential (PD-045).
**Actors:** BA/PO, Developer, Stakeholder.
**Preconditions:** Link is unexpired and unrevoked.
**Main Behaviour:** Each open of the link performs the scoped action again; no first-use consumption occurs.
**Business Rules:** PD-045.
**Acceptance Criteria:** Given a valid link already used once, When it is used again before expiry/revocation, Then the scoped action remains available.
**Error/Edge Conditions:** Use after expiry or revocation is denied.
**Priority:** MVP
**Dependencies:** FR-LNK-001, FR-LNK-005

### FR-LNK-005 — Link Revocation
**Requirement:** The system shall allow the link's generator (or Admin/QA Manager with project access) to revoke a temporary access link before its expiry.
**Purpose:** Provides a way to cut off access early if needed, mitigating the no-identity-verification trade-off (FR-LNK-002).
**Actors:** QA Tester (generator), QA Manager, Admin.
**Preconditions:** Link exists and is not already expired/revoked.
**Main Behaviour:** Actor revokes the link; subsequent uses are denied.
**Business Rules:** PD-018, PD-043.
**Acceptance Criteria:** Given an active link, When it is revoked, Then any subsequent attempt to use it is denied.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-LNK-001

### FR-LNK-006 — Free Sharing of Link by Holder **[New]**
**Requirement:** The system shall not restrict a link holder from copying or sharing the link URL with others; there is no mechanism preventing this.
**Purpose:** Explicit consequence of decisions on identity verification (FR-LNK-002) and multi-use (FR-LNK-004) — since the link is the sole, reusable credential, its holder can freely pass it on (PD-046).
**Actors:** BA/PO, Developer, Stakeholder (or anyone holding the link).
**Preconditions:** A valid link exists.
**Main Behaviour:** No technical restriction exists on forwarding, copying, or otherwise sharing the link URL.
**Business Rules:** PD-046. This is an accepted consequence of FR-LNK-002 and FR-LNK-004, not a defect.
**Acceptance Criteria:** Given a valid link, When its holder forwards it to a third party, Then that third party can use it exactly as the original holder could, until expiry/revocation.
**Error/Edge Conditions:** N/A — this is specified behaviour.
**Priority:** MVP
**Dependencies:** FR-LNK-002, FR-LNK-004

---

# SUB — Subscription & Billing

### FR-SUB-001 — Trial Plan
**Requirement:** The system shall offer a 14-day trial plan, requiring no payment, capped at a maximum of 3 seats, available only once per organisation.
**Purpose:** No-risk evaluation period for new organisations.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation has never previously activated a trial.
**Main Behaviour:** Organisation selects trial; 14-day countdown begins; seat count capped at 3.
**Business Rules:** PD-021. Once activated, the trial cannot be selected again, whether it expired or was converted to paid.
**Acceptance Criteria:** Given an organisation that has never used a trial, When it selects the trial plan, Then a 14-day, 3-seat-capped trial begins.
**Error/Edge Conditions:** An organisation that already used a trial (expired or converted) cannot select it again.
**Priority:** MVP
**Dependencies:** FR-SUB-002

### FR-SUB-002 — Mandatory Subscription for Platform Access
**Requirement:** The system shall block all platform functionality (projects, organisation features, etc.) for an organisation without an active trial or active paid subscription. This applies immediately after sign-up.
**Purpose:** Uniform billing enforcement from the first session.
**Actors:** All roles.
**Preconditions:** None.
**Main Behaviour:** Access checks verify active trial/subscription status before allowing any platform functionality.
**Business Rules:** PD-020.
**Acceptance Criteria:** Given an organisation with no active trial or subscription, When any member attempts to access platform functionality, Then access is blocked.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-SUB-001, FR-SUB-003

### FR-SUB-003 — Plan Selection (Trial, Monthly, Yearly)
**Requirement:** The system shall present trial, monthly, and yearly plan options on the subscription page for selection.
**Purpose:** Lets the organisation choose how to satisfy the mandatory subscription requirement.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation has no active trial/subscription, or is purchasing additional seats.
**Main Behaviour:** User selects a plan and completes the corresponding flow (FR-SUB-001, FR-SUB-004, or FR-SUB-005).
**Business Rules:** PD-021, PD-022, PD-023.
**Acceptance Criteria:** Given the subscription page, When viewed, Then trial (if not yet used), monthly, and yearly options are shown.
**Error/Edge Conditions:** Trial option is hidden/disabled if already used by the organisation.
**Priority:** MVP
**Dependencies:** FR-SUB-001, FR-SUB-004, FR-SUB-005

### FR-SUB-004 — Monthly Subscription Plan
**Requirement:** The system shall offer a monthly subscription plan where the user specifies the number of seats at subscribe time, billed at $10 per seat, charged as a single upfront payment for the total (seats × $10).
**Purpose:** Flexible paid option without annual commitment.
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** User specifies seat count; system calculates and charges seats × $10 upfront.
**Business Rules:** PD-022. All amounts in USD.
**Acceptance Criteria:** Given a seat count of N, When the monthly plan is purchased, Then the charge is N × $10, paid upfront.
**Error/Edge Conditions:** Payment failure prevents plan activation.
**Priority:** MVP
**Dependencies:** FR-SUB-006

### FR-SUB-005 — Yearly Subscription Plan
**Requirement:** The system shall offer a yearly subscription plan where the user specifies the number of seats at subscribe time, billed at $9 per seat per month, with the 12-month total (seats × $9 × 12) calculated and shown before payment, charged as a single upfront payment.
**Purpose:** Discounted rate as an incentive for annual commitment.
**Actors:** Admin, QA Manager.
**Preconditions:** None.
**Main Behaviour:** User specifies seat count; system shows and charges seats × $9 × 12 upfront.
**Business Rules:** PD-023. All amounts in USD.
**Acceptance Criteria:** Given a seat count of N, When the yearly plan is purchased, Then the total shown and charged is N × $9 × 12, paid upfront.
**Error/Edge Conditions:** Payment failure prevents plan activation.
**Priority:** MVP
**Dependencies:** FR-SUB-006

### FR-SUB-006 — Payment Confirmation Email
**Requirement:** The system shall send a confirmation email stating the plan and amount charged upon successful subscription payment (monthly or yearly).
**Purpose:** Confirms the payment succeeded and what was charged.
**Actors:** Admin, QA Manager (recipient).
**Preconditions:** A subscription payment succeeds.
**Main Behaviour:** Confirmation email sent immediately after successful payment.
**Business Rules:** PD-024. No itemized invoice/receipt beyond this email is required.
**Acceptance Criteria:** Given a successful payment, When it completes, Then a confirmation email with plan and amount is sent.
**Error/Edge Conditions:** Delivery failure triggers retry (FR-NOT-005).
**Priority:** MVP
**Dependencies:** FR-NOT-005

### FR-SUB-007 — Seat Limit Enforcement on Invitation
**Requirement:** The system shall block an organisation invitation that would cause the seat count to exceed the number of seats paid for (or the 3-seat trial cap), and shall show a notification directing the inviter to a page to pay for additional seats.
**Purpose:** Enforces the paid-seat model at the point of invitation.
**Actors:** Admin, QA Manager (inviter).
**Preconditions:** Inviting would exceed the current seat allowance.
**Main Behaviour:** Invitation is blocked; notification with a link to seat purchase (FR-SUB-008) is shown.
**Business Rules:** PD-025.
**Acceptance Criteria:** Given an organisation at its seat limit, When Admin/QA Manager attempts to invite another member, Then the invitation is blocked and a seat-purchase notification is shown.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-ORG-004, FR-SUB-008

### FR-SUB-008 — Proactive Seat Purchase
**Requirement:** The system shall allow Admin or QA Manager to purchase additional seats at any time, without first needing to hit the seat limit.
**Purpose:** Lets organisations plan ahead for growth.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation has an active trial or paid subscription. Note: seat purchase beyond the trial cap requires conversion to a paid plan (FR-SUB-001).
**Main Behaviour:** Actor purchases additional seats; seat count increases immediately upon successful payment.
**Business Rules:** PD-026.
**Acceptance Criteria:** Given an active paid subscription, When Admin/QA Manager purchases additional seats proactively, Then the seat count increases without requiring a blocked invitation first.
**Error/Edge Conditions:** Attempting to add seats beyond 3 while still on trial requires converting to a paid plan first (FR-SUB-001).
**Priority:** MVP
**Dependencies:** FR-SUB-004, FR-SUB-005

### FR-SUB-009 — Seats Only Increase, No Refunds
**Requirement:** The system shall not permit seat count to be reduced, and shall not issue refunds or credits for unused seats, even if organisation members are later removed.
**Purpose:** Keeps billing logic simple for MVP.
**Actors:** N/A (system constraint).
**Preconditions:** None.
**Main Behaviour:** No seat-reduction or refund/credit action exists.
**Business Rules:** PD-028.
**Acceptance Criteria:** Given an organisation that removes members, When seat count is checked afterward, Then it remains unchanged (not reduced), and no refund/credit is issued.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** None

### FR-SUB-010 — Grace Period on Subscription Lapse
**Requirement:** The system shall grant a 14-day grace period of continued platform access when a paid subscription lapses (e.g., a failed renewal), during which Admin and QA Manager are notified via all available channels (in-app and email). After 14 days without resolution, the system shall block platform access until payment is resolved. This grace period shall not apply to trial expiry, where access is blocked immediately at day 14.
**Purpose:** Buffers paying customers against involuntary churn, while trial users (who haven't paid) get no such buffer.
**Actors:** Admin, QA Manager (notified); all roles (affected by eventual block).
**Preconditions:** A paid subscription lapses.
**Main Behaviour:** 14-day grace period begins on lapse; multi-channel notifications sent; access blocked if unresolved after 14 days.
**Business Rules:** PD-029.
**Acceptance Criteria:**
- Given a lapsed paid subscription, When the lapse occurs, Then Admin and QA Manager are notified in-app and by email, and access continues for 14 days.
- Given a lapsed paid subscription unresolved after 14 days, When the grace period ends, Then platform access is blocked.
- Given a trial expiring at day 14, When it expires, Then access is blocked immediately with no grace period.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-NOT-001, FR-NOT-002

### FR-SUB-011 — Staggered Renewal for Mid-Term Yearly Seat Purchases
**Requirement:** The system shall charge additional seats purchased mid-term on a yearly plan at the full yearly rate (seats × $9 × 12), and shall make those seats valid for 12 months from their own purchase date, independent of the original subscription's renewal date.
**Purpose:** Reflects that each seat batch is its own independent 12-month commitment.
**Actors:** Admin, QA Manager.
**Preconditions:** Organisation is on an active yearly plan; additional seats purchased before the original subscription's renewal date.
**Main Behaviour:** New seat batch's 12-month term is tracked independently of the original batch's renewal date.
**Business Rules:** PD-027. Different seat batches within the same organisation can have staggered renewal dates.
**Acceptance Criteria:** Given an active yearly plan, When additional seats are purchased mid-term, Then those seats are billed at seats × $9 × 12 and renew 12 months from their own purchase date.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-SUB-005, FR-SUB-008

### FR-SUB-012 — Billing and Seat History Visibility Restricted to Admin/QA Manager **[Updated]**
**Requirement:** The system shall restrict visibility of billing and seat purchase/usage history to users holding the Admin or QA Manager role. No other role shall have read-only or any other access to this information.
**Purpose:** Keeps billing/seat data restricted to the same roles already responsible for managing subscriptions and seats (PD-047).
**Actors:** Admin, QA Manager (viewers); QA Tester and link-based roles (excluded).
**Preconditions:** Billing/seat history exists.
**Main Behaviour:** Billing/seat history view/query is only accessible to Admin and QA Manager.
**Business Rules:** PD-047.
**Acceptance Criteria:**
- Given an Admin or QA Manager, When they open billing/seat history, Then they can view it.
- Given a QA Tester or a link-based role, When they attempt to access billing/seat history, Then access is denied.
**Error/Edge Conditions:** N/A.
**Priority:** MVP
**Dependencies:** FR-SUB-006, FR-SUB-007, FR-SUB-008, FR-SUB-011

---

# IMP — Import/Export

### FR-IMP-001 — Bulk Import
**Requirement:** The system shall support bulk import of entities (scope: see FR-IMP-003).
**Purpose:** Reduces manual data entry for existing data.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** User uploads a data file; system creates entities from it.
**Business Rules:** Postponed to Post-MVP.
**Acceptance Criteria:** Not yet defined — Post-MVP.
**Error/Edge Conditions:** Not yet defined.
**Priority:** Post-MVP
**Dependencies:** FR-IMP-003

### FR-IMP-002 — Bulk Export
**Requirement:** The system shall support bulk export of entities (scope: see FR-IMP-003).
**Purpose:** Supports data portability.
**Actors:** QA Manager, Admin.
**Preconditions:** None.
**Main Behaviour:** User exports data to a file.
**Business Rules:** Postponed to Post-MVP.
**Acceptance Criteria:** Not yet defined — Post-MVP.
**Error/Edge Conditions:** Not yet defined.
**Priority:** Post-MVP
**Dependencies:** FR-IMP-003

### FR-IMP-003 — Import/Export Entity Scope
**Requirement:** The system shall define which entity types are in scope for import/export.
**Purpose:** Bounds the import/export feature.
**Actors:** N/A (scope definition).
**Preconditions:** None.
**Main Behaviour:** N/A — scope not yet decided.
**Business Rules:** Postponed to Post-MVP; requirements import/sync specifically is covered by PD-011.
**Acceptance Criteria:** Not yet defined.
**Error/Edge Conditions:** N/A.
**Priority:** Post-MVP
**Dependencies:** None

---

## Open Requirement Questions

- What is the organisation name uniqueness policy at sign-up (FR-ORG-001) — must names be globally unique, or can duplicates exist across organisations?
- What is the session expiry/duration policy (FR-AUTH-003)?
- What is the full scope of "organisation settings" beyond membership and subscription (FR-ORG-003)?
- Can QA Tester view the organisation member list (FR-USR-006), or is that restricted to Admin/QA Manager only?
- What exact status label does a requirement-archive-cascade-cancelled test run receive, to distinguish it from a normally closed run (FR-TR-003, FR-REQ-004)?
- If a test case is in "Needs Review" status and the project's QA workflow subsequently has its approval step disabled, does the test case remain stuck in Needs Review, or does it become self-approvable by its creator per FR-TC-005's no-approval-step path? (Raised by applying decisions 10–12 together.)
- Is the lapse-grace-period notification (FR-SUB-010) a single notice, or does it repeat/remind across the 14 days?
- Is the staggered renewal behavior for mid-term yearly seat purchases (FR-SUB-011) acceptable as a permanent model, or should a future consolidation/alignment mechanism be considered?
- Is there any upper limit on how many seats can be purchased in a single transaction (FR-SUB-008)?
- What happens to an organisation's data/access if the trial ends and the organisation never subscribes (long-term dormant/unpaid organisations) — is there a data retention or deletion policy?
- Is there any warning shown before a trial's 3-seat cap blocks a new invitation, similar to the paid-plan seat-limit notification (FR-SUB-007)?

## Potential Requirement Conflicts

- **Resolved by this update:** The prior ambiguity between "pre-deployment report" and "post-deployment report" as possibly-separate deliverables (previously flagged against FR-RPT-001/002) is resolved — FR-RPT-002 now specifies a single report type with a Post-Deployment section (PD-038).
- **Resolved by this update:** The prior undefined interaction between BA/PO report approval (FR-RPT-003) and any release/workflow gating is resolved — approval/rejection is explicitly record-keeping only, with no downstream trigger (PD-039).
- **New watch item:** FR-TC-005 (self-approval, Needs Review) and FR-REQ-002 (requirement-edit-triggered re-review) together mean a test case's approval history can now cycle through Approved → Needs Review → Pending Approval → Approved multiple times over its life. No conflict identified, but reporting/traceability views that assume a one-way approval flow should account for this cycle.
- **New watch item:** FR-LNK-002 (no identity verification) combined with FR-RPT-004 (BA/PO comments private to QA Tester) means a comment attributed to "BA/PO" is only as trustworthy as the link's possession — anyone with the link could leave a comment. This is consistent with the already-accepted link trade-off (PD-043) and is not treated as a new conflict, but is noted for awareness.
