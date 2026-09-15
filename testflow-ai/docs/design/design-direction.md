# Design Direction

**Status:** Approved visual direction, formalized from AI-assisted design exploration.
**Scope:** This document explains *why* the direction was chosen and what future screens must preserve. It does not define exact tokens or components — see [`design-system.md`](./design-system.md) for that.

---

## 1. Visual Philosophy

TestFlow is a professional, high-density productivity application for software quality teams — QA Managers, QA Testers, Admins, and (via scoped links) BA/POs, Developers, and Stakeholders reviewing test artifacts. It is not a consumer app and not a marketing-led "AI SaaS" product.

The approved direction is:

- **Professional and precise** — the product handles requirements traceability, defect evidence, and audit history; the visual language should read as trustworthy and exact, not playful.
- **Calm** — a QA Manager may have a project dashboard, a test run, and a defect list open across a working session. Nothing should compete visually for attention that doesn't need it.
- **Modern without being decorative** — current, not dated, but restraint takes priority over visual flourish.
- **Information-dense** — the product is built around tables of hundreds to thousands of records (requirements, test cases, execution results). Density is a feature, not a compromise.
- **Technical without resembling a terminal** — `JetBrains Mono` is used selectively for identifiers (see §5 of the design system), but the product is not styled as a developer console.
- **Enterprise-capable without feeling dated** — the product must hold up in front of enterprise QA/engineering buyers without resorting to dense-but-ugly legacy enterprise-tool patterns.

**Explicitly rejected directions** (see design-system.md §1 for the full list): excessive whitespace, oversized dashboard cards, heavy rounding, gradients, glassmorphism, decorative illustration, unnecessary shadow, and generic AI-SaaS visual tropes (glow, sparkle, gradient "AI" branding).

## 2. Why This Direction Was Selected

The product's core value proposition — from `vision.md` and `prd.md` — is helping QA teams manage large volumes of structured testing artifacts faster and more reliably, with AI as an accelerant, not the product itself. A visual direction that leads with decoration or a distinct "AI product" identity would undercut that: the AI-assisted actions (`Generate with AI`, `Suggest Test Cases`, etc.) are one path into ordinary TestFlow records, not a separate experience (§13; also reflected in [`05-ai-test-generation.md`](./user-flows/05-ai-test-generation.md)'s explicit draft-vs-saved distinction).

A restrained dark-navy primary palette, high information density, and a component system shared across all record types support the product's actual usage pattern: a small number of expert users working through the same project, repeatedly, over a long session — not a first-time visitor being sold on the product inside the app itself.

## 3. Productivity Principles

These principles govern every future screen, regardless of entity:

- Design for datasets in the hundreds to thousands (test cases, requirements, execution results), not for a handful of demo rows.
- Prioritize scannability and horizontal information density over generous padding.
- Use progressive disclosure (detail drawers, expandable sections) rather than pushing all detail into the primary list view.
- Never substitute a card grid for a table merely for visual appeal — cards are earned by workflow needs (e.g., the dashboard's summary panels), not applied by default to record lists.
- Manual and AI-assisted paths through the same workflow must look and behave identically once the AI step ends — see §13 of the design system.

## 4. Representative Validated Screens

Two screen types were used during AI-assisted exploration to validate the direction. They are **design references**, not additional product requirements — the underlying workflows they reflect are already covered by the approved [user flows](./user-flows/00-user-flow-index.md).

### Dashboard
Validated the expanded vertical navigation shell and analytical/monitoring layout patterns: aggregate progress indicators, project/QA Scope context, test-area health, recent test run summaries, and defect/release-blocker visibility. Corresponds to [UXF-014 — Dashboard & Progress Monitoring](./user-flows/09-reporting-and-dashboards.md). **(CHANGE-002 copy correction, PD-064: "sprint" replaced with the neutral "QA Scope" — no redesign, see `design-system.md` §17.1.)**

### Test Case Management
The primary reference for nearly everything else: high-density list management, saved views, search and filtering, active filter chips, bulk selection and contextual bulk actions, a high-density table with linked requirement identifiers, a right-side detail drawer, structured Action/Expected-Result test steps, and AI-assisted generation surfaced as a secondary, non-distinct action. Corresponds to [UXF-006 — Manual Test Case Creation & Self-Service Approval](./user-flows/04-test-case-management.md) and [UXF-009 — AI-Assisted Test Case Generation](./user-flows/05-ai-test-generation.md).

## 5. Relationship Between the Two Reference Screens

The Dashboard establishes the **shell** (navigation, page framing) and the analytical/summary visual language. Test Case Management establishes the **workspace** visual language (tables, filtering, detail inspection, forms, actions). Every other screen — Requirements, Test Suites, Test Runs, Defects, Reports — is expected to compose these two vocabularies rather than invent a third: use the Dashboard's shell and summary-panel conventions where a screen needs monitoring/overview content, and the Test Case Management's list-workspace conventions where a screen manages a dataset of records.

## 6. What Future Screens Must Preserve

Before designing any new screen, its author should be able to point at this document and the design system for: the navigation shell, the colour roles, the typography roles, the density principles, the list-workspace pattern, the detail-drawer pattern, the bulk-action pattern, the filter pattern, and the AI-UX principle. Anything a new screen seems to need beyond that is a design-system gap, not a license to improvise — see the Design Governance section of [`design-system.md`](./design-system.md#17-design-governance).
