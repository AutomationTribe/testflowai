# UX Gap Analysis & UX Decisions Required

This document covers §10 and §11 of the user-flow design review. Nothing here changes any approved product requirement, decision, or API contract — gaps and improvement ideas are reported for your review, not silently implemented.

---

## Part A — UX Gap Analysis

### Missing User Actions

- **No flow exists for configuring a project's AI provider key** (FR-AI-003 — optional per-project AI key configuration). This was already flagged as a documentation gap in `requirements-traceability.md` (no API endpoint documented for it either). It needs a small settings screen and a small API addition in a future pass — not invented here.
- **No explicit "reassign defect" action** distinct from the original assignment — re-running "Assign to Developer" (UXF-011) with a different recipient serves this, but it's worth confirming that's the intended mechanism rather than a dedicated "reassign" action, since the UX framing ("assign" vs. "reassign") could read oddly to a user reassigning an already-in-progress defect.

### Unclear Transitions

- When a test run is cancelled-and-archived via a requirement-archive cascade (UXF-005 → UXF-010), it's unclear whether a tester **actively viewing that run at that moment** sees it update live or only discovers the change on next refresh/navigation. No approved requirement specifies real-time UI updates anywhere in the product — this is a reasonable gap to leave open until a broader "does TestFlow need any real-time/live-update behavior" decision is made (none is currently approved or implied).
- Whether "Needs Review" reached via a direct test case edit looks/feels the same in the UI as "Needs Review" reached via an upstream requirement edit (UXF-004/UXF-006) is not specified — both are the same status value, but the *reason* differs and a user re-approving might want to know why. This is a content/microcopy question best resolved at wireframe stage, not blocking now.

### Requirements Producing Awkward Workflows

- None identified that rise to the level of "awkward" — the self-service approval simplification (PD-048) in particular removed what would otherwise have been the most complex workflow (a QA-Manager review queue with reject/resubmit cycles).

### Permission Ambiguity

- Carried forward from `functional-requirements.md`: whether **QA Tester can view the organisation member list** (FR-USR-006) remains unresolved. This directly affects whether a "Team" area is visible at all to QA Testers in later navigation design — worth resolving before wireframes, not just at implementation time.

### Missing Error Behaviour

- None identified beyond what's already documented per-flow — every flow's Error/Failure Paths section maps to an approved error condition in the relevant `api/*.md` document.

### Unnecessary Steps

- None identified as clearly unnecessary. The AI generation review step (UXF-009) requires per-draft attention with no bulk "keep all"/"discard all" shortcut, which is a direct, approved consequence of no-bulk-operations-at-MVP (APID-004) — not an oversight, but flagged below as a future improvement worth reconsidering once real usage data exists.

### Places the Product May Be Difficult to Use

- **Reviewing a large batch of AI-generated drafts one at a time**, with no bulk accept/discard, could feel tedious for a requirement that generates many test cases. This is a direct, already-approved trade-off (APID-004), not something to change now — flagged as a candidate for a future decision, not a current gap.
- **Discovering test cases that need re-approval** relies on the user actively filtering by `needs_review` status (an approved API filter) rather than any proactive prompt — see UX Decision D4 below.

---

## Part B — UX Decisions Required (Workflow/Interaction Only — No Visual Styling)

### D1 — AI Generation Waiting Experience

**Decision:** Should the user be held on a blocking "processing" screen during AI generation (up to ~60 seconds), or be free to navigate elsewhere and be notified when it's ready?

**Why it matters:** Generation is the product's core differentiator; a bad waiting experience directly undermines the "faster test case creation" value proposition, even though the underlying API is already async (`202 Accepted` + poll, APID-005).

**Options:**
- (a) Blocking wait screen with progress indication — simple to build, keeps the user's attention on the task, but "wastes" up to a minute of their time if they have nothing else to do meanwhile.
- (b) Non-blocking: user can navigate away; a notification (UXF-016) tells them when drafts are ready to review.

**Advantages/Disadvantages:** (a) is simpler and matches most users' expectation of "I asked for this, I'll wait a moment"; up to 60 seconds is a long wait to hold someone captive on a blank screen, though. (b) respects the user's time better but adds complexity (they must be able to resume review later, from more than one entry point) and risks the review step being forgotten/delayed.

**Recommendation:** (a) for MVP, with a visible progress/waiting indicator, given the target is typically well under the 60-second worst case (NFR-AI-001's 95th-percentile target is 30 seconds) — simplicity wins at this scale, and (b) can be reconsidered later if generation times prove to be a real friction point.

**Must decide now or can wait:** Should be decided before wireframing this specific screen, since it changes the screen's fundamental shape (a modal/blocking state vs. a dismissible toast + separate review-later entry point).

---

### D2 — Concurrent-Edit Conflict Resolution

**Decision:** When a Test Case or Requirement edit is rejected due to a version mismatch (APID-003), what does the user see and do next?

**Why it matters:** This is a real, if infrequent, situation given multiple people can work in the same project.

**Options:**
- (a) Hard error: "This was changed by someone else. Please reload and reapply your changes." User's in-progress edit is lost unless they've copied it out manually.
- (b) Show a diff/merge view letting the user choose which changes to keep.

**Advantages/Disadvantages:** (a) is simple and matches what the approved API contract already returns (a bare `409 conflict`, no diff data). (b) is a much better experience but requires the API to return both versions' content for comparison — not currently part of the approved contract, and would need a new decision to add it.

**Recommendation:** (a) for MVP — consistent with the API decision already made (APID-003 didn't include a diff-data contract), and the underlying conflict is expected to be rare.

**Must decide now or can wait:** Can wait until wireframing that specific screen, but should be decided before, not during, that pass — it affects whether the API needs a follow-up addition (diff data) first.

---

### D3 — Requirement-Edit Cascade Warning Style

**Decision:** When editing a requirement that will push linked, Approved test cases to Needs Review (UXF-004), should the warning be a blocking confirmation modal before save, or a non-blocking notice shown after save completes?

**Why it matters:** The cascade is a real, if reversible-by-re-approval, consequence — the user should not be surprised by it.

**Options:**
- (a) Blocking confirmation before save ("Saving will move N test case(s) to Needs Review — continue?").
- (b) Save immediately, then show a dismissible notice ("N test case(s) moved to Needs Review").

**Advantages/Disadvantages:** (a) prevents an unintended cascade but adds a click to every requirement edit that happens to have approved dependents, even minor ones. (b) is faster for frequent small edits but risks the consequence going unnoticed.

**Recommendation:** (a) — the consequence affects other people's work (test cases someone else approved), which is a meaningfully different situation from a routine solo edit, and deserves a moment of confirmation.

**Must decide now or can wait:** Should be decided before wireframing the requirement-edit screen.

---

### D4 — Surfacing "Needs Review" Test Cases Proactively

**Decision:** Should test cases in Needs Review status be surfaced proactively (e.g., a count/badge, a dedicated filtered view prompted on login) or left to be found via the existing status filter?

**Why it matters:** Self-service approval (PD-048) removed the formal review queue — without some proactive surfacing, a test case could sit in Needs Review indefinitely without anyone noticing.

**Options:**
- (a) Purely passive — the `status=needs_review` filter exists (already approved, `api-spec.md`) but nothing draws attention to it.
- (b) A visible count/badge on the project or test case area, prompting review.

**Advantages/Disadvantages:** (a) is simpler and requires no new capability. (b) directly addresses the "how do people notice" gap but requires design/placement decisions now deferred to wireframing anyway.

**Recommendation:** (b) in principle — some proactive surfacing (even simple, like a badge count) meaningfully improves usability given there's no other prompt mechanism for this state. The exact visual treatment is a wireframe-stage decision, but the *decision to have some form of proactive surfacing at all* is a workflow decision worth confirming now.

**Must decide now or can wait:** Should decide now (yes/no on proactive surfacing) — the specific visual form can wait for wireframes.

---

### D5 — Expired/Invalid Link Recovery Path

**Decision:** When a link-based recipient (BA/PO, Developer, Stakeholder) hits an expired/invalid link, should the screen offer any way to request a new one, or simply show a dead-end message?

**Why it matters:** These recipients have no account and no way to log in and self-serve a new link.

**Options:**
- (a) Dead-end message only ("This link is no longer valid.") — the recipient must contact the person who originally sent it.
- (b) A "request a new link" action on that screen, notifying the original generator.

**Advantages/Disadvantages:** (a) is simplest and matches current approved scope exactly (no such capability is described anywhere in the FRs). (b) would be a genuinely useful addition but is new functionality not currently approved.

**Recommendation:** (a) — building (b) would mean inventing a capability beyond approved scope.

**Must decide now or can wait:** Effectively already decided by scope — (a) is the only option consistent with approved requirements; no further decision needed unless you want to approve (b) as new scope.
