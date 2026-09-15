# Design System

**Status:** Formalizes the approved visual/interaction direction from AI-assisted design exploration (see [`design-direction.md`](./design-direction.md) for the *why*). This document controls visual appearance; screen specifications (wireframes, when produced) control content, workflow, and layout — see §17.

This is documentation only. It records approved design rules and known tokens; it does not implement code, tokens-as-code, or components.

---

## 1. Foundations

TestFlow's visual direction is professional, precise, calm, modern, information-dense, and technical without resembling a terminal or a generic AI-SaaS product. Productivity and information clarity take priority over decoration.

**Avoid:** excessive whitespace, oversized dashboard cards, excessive rounded corners, gradients, glassmorphism, decorative illustrations, unnecessary shadows, generic AI-SaaS aesthetics.

## 2. Typography

| Role | Typeface | Usage |
|---|---|---|
| Primary UI typography | Hanken Grotesk | All standard interface content — labels, body text, navigation, form fields, table content. |
| Technical identifier typography | JetBrains Mono | Selectively, for technical identifiers only: `TC-1042`, `REQ-088`, `DEF-112`, `TR-041`, and similar record identifiers. |

Monospace is **not** used for normal interface content (paragraphs, labels, descriptions) — only for the identifier class of content above.

Exact type scale (sizes, weights, line-heights) has **not** been approved yet — this is an unresolved item (see §19). Document roles here; assign final values during token extraction.

## 3. Colour Roles & Tokens

### 3.1 Approved foundation tokens

The following tokens are carried forward from the approved design exploration. No existing repository documentation defines conflicting colour values, so these are recorded as approved design-direction tokens:

| Token | Value | Role |
|---|---|---|
| `color-primary` | `#001f47` | Primary brand/action colour — restrained dark navy. |
| `color-primary-container` | `#02346d` | Primary container/surface variant (e.g., selected nav item background, primary button hover/pressed). |
| `color-surface-low` | `#f4f3f9` | Low-emphasis surface background (e.g., page background, low-emphasis panel fill). |
| `color-outline-variant` | `#c3c6d1` | Subdued border/divider colour (table row dividers, input borders, panel outlines). |

No conflict was found against any approved product, architecture, or database documentation — none of those documents specify colour values. This section is safe to treat as final foundation-token input to a future implementation, subject to the exact-value confirmations in §19.

### 3.2 Semantic token categories (roles only — values pending)

The following semantic categories are established as **required token categories**. Per the task's instruction, exact hex values are **not invented** here; each is marked pending confirmation.

**Test status:**

| Role | Notes |
|---|---|
| Passed | Maps to `execution_results.status = 'pass'` (schema.sql). |
| Failed | Maps to `execution_results.status = 'fail'`. |
| Blocked | Maps to `execution_results.status = 'blocked'`. |
| Not Run | Derived UI state — a test case in a run with no `execution_results` row yet. Not a stored enum value. |
| In Progress | **Flagged in §19** — no corresponding stored value was found on `execution_results` (values are `pass`/`fail`/`blocked`/`skipped`) or on `test_runs` (`open`/`closed`/`cancelled_archived`). Document the role; its exact meaning (a run-level state vs. a per-case state) needs product confirmation before token/behavior is finalized. Note also: `execution_results` includes a `skipped` value with no corresponding role named here — flagged in §19 for consistency. |

**Priority / severity:**

| Role | Notes |
|---|---|
| Critical | **Flagged in §19** — no `priority` or `severity` field exists on `test_cases` or `defects` in the approved schema (`schema.sql`). Recording the token role per instructions; it is not yet backed by an approved data field. |
| High | Same flag as above. |
| Medium | Same flag as above. |
| Low | Same flag as above. |

**General semantic:**

| Role | Notes |
|---|---|
| Success | General positive/confirmation state (e.g., successful save, payment succeeded). |
| Warning | General caution state (e.g., grace-period warning, PD-029; unsaved-changes warning). |
| Error | General failure state (e.g., validation error, payment failure). |
| Information | General neutral/informational state. |

Exact hex values for all semantic roles are unresolved — see §19.

## 4. Density Principles

TestFlow must support users working with hundreds to thousands of records (requirements, test cases, execution results) in a single project. Applies across every list/table screen:

- **Compact table rows** — rows sized for scanning many records per screen, not touch-target-scale spacing.
- **Compact controls** — inputs, buttons, and chips sized to match the density of surrounding content, not oversized relative to it.
- **Efficient page padding** — minimal unnecessary whitespace around content regions; padding earns its space, it isn't default.
- **High information density** — favor showing more relevant columns/fields over hiding them behind extra clicks, within readability limits.
- **Readable typography at compact sizes** — density must not come at the cost of legibility.
- **Efficient horizontal space use** — tables should make full use of available width before wrapping/truncating.
- **Progressive disclosure** — secondary detail (full record content, rarely-needed fields) belongs in the detail drawer or an expandable section, not inline in the list by default.

Large datasets must never be converted into a card-based layout purely for visual appeal — cards are earned by workflow need (e.g., dashboard summary panels), not applied by default to record lists (see [`design-direction.md`](./design-direction.md) §3).

## 5. Navigation

### 5.1 Application shell

Desktop application shell: **vertical left navigation**, expanded by default.

**Expanded state** contains, top to bottom:
- TestFlow logo/name
- Dashboard
- Requirements
- Test Cases
- Test Suites
- Test Runs
- Defects
- Reports

Secondary controls anchored toward the bottom:
- Project Settings
- User profile

**Collapsed state:** icon-only, with tooltip on hover/focus for the label. Count/notification badges must remain visible and legible in both expanded and collapsed states.

The expanded state is the standard desktop configuration; collapse is a user- or context-triggered variant (e.g., automatically when a detail drawer needs more horizontal space — see §10).

### 5.2 Navigation components

- Expanded sidebar
- Collapsed sidebar
- Sidebar item (with active/selected state, optional count badge)
- Notification badge
- Tabs (for in-page sectioning, e.g., within a project or record)
- Saved views (see §9)

## 6. Components

### 6.1 Actions

- Primary button
- Secondary button
- Tertiary action (text/link-style action)
- Destructive action (visually distinct from primary/secondary; see §11)
- Icon button

### 6.2 Forms

- Text input
- Textarea
- Search
- Select
- Multi-select
- Checkbox
- Radio
- Toggle

### 6.3 Data

- High-density table
- Sortable header
- Selectable row
- Linked identifier (uses JetBrains Mono per §2, links to the referenced record)
- Pagination
- Result count
- Configurable columns

### 6.4 Status

- Test status indicator (§3.2)
- Priority/severity indicator (§3.2 — pending data-field confirmation)
- Badges (general-purpose)
- Filter chips (§12)
- Count badges

### 6.5 Overlays

- Detail drawer (§10)
- Dropdown
- Context menu
- Tooltip
- Modal
- Destructive confirmation (see §11)

### 6.6 Feedback

- Empty state
- No search results
- No filtered results
- Loading state
- Success state
- Error state
- Disabled state

## 7. Interaction States

Every reusable component must support the states relevant to it:

- Default
- Hover
- Focus
- Selected
- Disabled
- Error
- Loading (where relevant)

Keyboard focus must remain visibly distinguishable from hover/default at all times — see §16.

## 8. List Workspace Pattern

Standard pattern for pages managing a dataset of records:

```
Page Header
  → Saved Views (where relevant)
  → Search
  → Filters
  → Active Filters
  → Result Count
  → Data Table
  → Pagination
```

Applies to: Requirements, Test Cases, Test Suites (where appropriate), Test Runs, Defects, and other large datasets. This pattern is a default, not a mandate — do not force it onto a screen whose workflow requires a different interaction model (e.g., the AI generation review step, which is a review-queue interaction, not a filtered list).

## 9. Saved Views

Preserve commonly reused filter configurations for reuse within the list workspace pattern (§8). Available where filtering is available; not every list screen requires saved views.

## 10. Detail Drawer Pattern

Established by the Test Case Management reference screen: a right-side panel for inspecting a record without losing list context (filters, scroll position, selection).

May contain: identifier, title, metadata, structured content, contextual actions, edit action, close action.

When horizontal space becomes constrained by an open drawer, the primary sidebar (§5.1) may collapse to free width.

Not every entity requires a drawer — apply it based on workflow needs (does the user benefit from inspecting a record without leaving the list?), not by default to every record type.

## 11. Bulk Action Pattern

- Bulk actions appear **contextually**, only after one or more records are selected.
- Common actions may be surfaced directly in the contextual bar.
- Rare or destructive bulk actions belong under a "More" grouping, clearly separated from common actions.
- Destructive operations (bulk or single-record) require a destructive confirmation overlay (§6.5) before executing.

Note: bulk operations on AI-generated draft review are explicitly out of scope at MVP per APID-004 (documented in `12-ux-gap-analysis-and-decisions.md`) — this pattern governs bulk actions on already-saved records, not the AI draft review step (§13).

## 12. Filter Pattern

- Filters remain compact — not a large always-open panel by default.
- Active filters are shown individually, each independently removable, e.g.:

  ```
  Priority: Critical ×    Suite: Regression ×    Automation: Manual ×
  ```

- Include a "Clear All" action when more than one active filter is present.
- Saved Views (§9) may capture a filter configuration for reuse.

## 13. AI UX Principle

AI is a capability within TestFlow, not a separate visual identity or product. AI-initiated actions — `Generate with AI`, `Suggest Test Cases`, `Suggest Edge Cases`, `Improve Test Steps` — use the same component system, colour roles, and typography as every other action in the product.

**Explicitly avoid:** a separate AI colour system, glowing AI controls, AI-specific gradients, a permanent chatbot UI without a workflow requirement, and excessive sparkle/decoration signalling "this is AI."

Manual workflows remain first-class and visually equal — AI is an accelerant into the same Draft → Approved → Needs Review lifecycle (PD-048), not a parallel one. See [UXF-009](./user-flows/05-ai-test-generation.md) for the approved flow-level treatment of the draft-vs-saved distinction this principle protects.

## 14. Test Case Workspace Design Principles

Validated by the Test Case Management reference screen; these principles extend to any other high-volume record workspace:

- Table-first interface, not card-first.
- Designed for 1,000+ records without workflow degradation.
- Compact rows.
- Configurable, sortable columns.
- Linked requirement identifiers (using the identifier component, §6.3).
- Automation status visibility (as a column/indicator, not buried in the detail drawer only).
- Contextual bulk actions (§11).
- Right-side inspection via the detail drawer (§10).
- Structured Action / Expected Result test steps (not freeform text blocks).
- Saved views (§9).
- Pagination / dataset navigation, consistent with the API's cursor-based pagination convention (APID-002).

## 15. Accessibility

- Sufficient colour contrast for all text and meaningful UI elements.
- Visible keyboard focus indicator on every interactive element (§7).
- All controls keyboard-accessible (no mouse/pointer-only interactions).
- Semantic states (status, priority/severity, errors) are never communicated by colour alone — pair with text/label/icon.
- Compact typography (§4) remains readable — density must not compromise legibility.
- Clear, unambiguous disabled states.
- Clear, unambiguous selected states, distinguishable from hover/focus.

## 16. Representative Screens Used for Validation

Two screen types validated this design direction during AI-assisted exploration. Full rationale in [`design-direction.md`](./design-direction.md) §4–5. Summary:

- **Dashboard** — validated the navigation shell and analytical/monitoring layout patterns.
- **Test Case Management** — validated nearly the entire list-workspace, table, filtering, bulk-action, and detail-drawer component set (§6, §8–§12).

These are design references, not additional product requirements — see [`design-direction.md`](./design-direction.md).

## 17. Design Governance

**The TestFlow Design System controls visual appearance. Screen specifications control content, workflow, and layout.**

Future screen designs must **not** independently invent:
- Primary colours
- Semantic colours
- Typography
- Button styles
- Navigation treatments
- Table styling
- Filter styling
- Spacing systems
- Radii
- Status treatments

**When a future screen needs something not covered here:**
1. Identify the missing design need.
2. Determine whether an existing component (§6) can solve it.
3. If not, propose a design-system extension.
4. Document the decision (extend this file, with rationale).
5. Only then use the new pattern.

Do not silently create one-off visual conventions on a per-screen basis.

### 17.1 Methodology-Neutral Terminology (CHANGE-002, PD-064)

Future screens, Stitch prompts, and copy must **never hard-code** a development-methodology term — "Sprint," "Iteration," "Phase," "Release," "Cycle" — as universal TestFlow product terminology. TestFlow does not model or assume Scrum, Kanban, Waterfall, or any other delivery methodology.

- **BAD** (assumes a methodology): "Sprint Test Report," "Sprint Readiness," "Sprint Execution Progress."
- **GOOD** (neutral product terminology): "Test Report," "Project Readiness," "Test Execution Progress."
- Context may separately display an actual organisation/document value, e.g. a QA Scope field showing "Sprint 17" — that is organisation/document *data*, not TestFlow *terminology*, and is fine.
- If no organisation preferred scope terminology is set (FR-QAOM-013), UI defaults to the neutral label **"QA Scope"** — never "Sprint."
- This rule applies to all future screen specifications and Stitch prompts. It does **not** require redesigning any already-approved screen whose sample/placeholder data happens to read "Sprint 17" (e.g., the Dashboard reference screen in `design-direction.md` §4) — that is a copy/sample-data correction, not a material redesign, and is tracked in `requirements-change-log.md` under CHANGE-002 rather than triggering rework here.

## 18. Cross-References

- Visual philosophy and rationale: [`design-direction.md`](./design-direction.md)
- Approved user flows this system supports: [`user-flows/00-user-flow-index.md`](./user-flows/00-user-flow-index.md)
- API pagination/error conventions referenced above: `docs/technical/api-spec.md`
- Architecture context (web frontend framework, etc.): `docs/technical/architecture.md`

## 19. Unresolved / Pending Items

These are flagged, not resolved, per the review requirement — none are silently decided here:

1. **Exact type scale** (font sizes, weights, line-heights for Hanken Grotesk and JetBrains Mono roles) — not yet approved; only typographic *roles* are documented (§2).
2. **Exact semantic hex values** — Test Status, Priority/Severity, and General semantic tokens (§3.2) have approved *roles* but no approved *values*. Requires final token extraction from the design exploration artifacts or a fresh design decision.
3. **"In Progress" test status** — no corresponding stored value exists in the approved schema (`execution_results.status` is `pass`/`fail`/`blocked`/`skipped`; `test_runs.status` is `open`/`closed`/`cancelled_archived`). Needs product/API clarification on what this role represents before it can be implemented — flagged, not decided, here.
4. **"Skipped" execution result** — `execution_results.status` includes `skipped` (schema.sql) with no corresponding UI role requested in this pass; should be added to the Test Status token set when resolving item 3.
5. **Priority/Severity fields do not yet exist** on `test_cases` or `defects` in the approved schema or functional requirements. The four token roles (Critical/High/Medium/Low) are documented per instruction, but implementing them requires a prior product/database decision to add the underlying field(s) — out of scope for this documentation pass.
6. **Spacing system and corner-radius scale** — not specified in the source design exploration beyond "avoid excessive rounded corners"; needs exact values before implementation.
7. **The 5 UX decisions (D1–D5)** in [`12-ux-gap-analysis-and-decisions.md`](./user-flows/12-ux-gap-analysis-and-decisions.md) remain pending approval and affect specific screen shapes (e.g., D1's blocking-vs-non-blocking AI wait screen); this design system does not resolve them.
