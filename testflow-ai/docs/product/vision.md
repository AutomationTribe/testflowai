# TestFlow AI — Product Vision

## 1. Product Name
TestFlow AI

## 2. Product Vision
To be the QA operating platform that software teams use to define, govern, and run their own test management process — planning, generating, executing, and reporting on testing within a QA Operating Model each organisation configures — using AI to accelerate test case creation while keeping humans in control of quality decisions.

**Approved product pivot (see `product-decisions.md`, ORG-QA-DEC series, and `requirements-change-log.md`):** TestFlow is not a single hard-coded QA process. It is a platform that provides stable, TestFlow-controlled test-management semantics — execution, traceability, versioning, historical integrity — on top of which each organisation defines and governs its own QA Operating Model: process, document templates, document lifecycle/workflow, policies, and release/quality gates. This is a foundational product principle, not an optional feature.

## 3. Problem Statement
QA teams spend significant manual effort writing test cases from requirements or task descriptions, tracking execution across suites and runs, and producing reports for stakeholders. Existing test management tools typically do not use AI to reduce this manual authoring effort, and teams often rely on disconnected tools for requirements, testing, and defect tracking — making traceability and reporting harder to maintain.

## 4. Product Purpose
To give software teams a single, web-based system to plan, manage, and execute testing — from requirements through test case creation, execution, defect tracking, and reporting — while using AI to reduce the manual effort of writing test cases, so teams can test more thoroughly in less time.

## 5. Target Users
- QA engineers and testers who write and execute test cases within their organisation's QA Operating Model
- QA managers / authorized organisation administrators who define and govern the organisation's QA Operating Model — process, templates, workflow, policy, quality gates — and oversee testing
- Business analysts / product owners who write or import requirements and review test results and reports
- Developers who receive and resolve defects
- Stakeholders who need visibility into testing progress and quality

## 6. High-Level Value Proposition
- Faster test case creation through AI generation, aware of the organisation's configured template and process
- Full traceability from requirement to test case to execution result to defect, with stable TestFlow-controlled semantics that hold regardless of an organisation's configuration
- Organisations govern their own QA Operating Model — document templates, document workflow/approval, project policy, and release/quality gates — rather than conforming to one hard-coded process; TestFlow ships sensible defaults so teams get value immediately without manual setup
- Centralized reporting and dashboards for progress and quality visibility, built on stable system metrics regardless of organisation-specific configuration
- Multi-tenant platform supporting unlimited teams/projects at scale
- Delivered as a paid, subscription-based product, with a free trial period and monthly or yearly paid plans

## 7. Major Product Capabilities
- Requirements management (native authoring and import/sync)
- Test case management, including AI-generated test cases
- Test suite organization
- Test execution and results tracking
- Defect management (native)
- Requirement-to-test-case traceability
- Reporting and dashboards
- Team/project setup with role-based access
- Organisation QA Operating Model: configurable document templates, document lifecycle/workflow, project policy, and release/quality gates, governed by the organisation and applied consistently to its projects (see §2/§8 below and `product-decisions.md`, ORG-QA-DEC series). The previous "self-service test case approval only" model (Draft → Approved → Needs Review) remains the default, lightweight behaviour — it is no longer the only behaviour every organisation is forced into.
- Audit history of key actions, extended to cover QA-configuration changes (template/workflow/policy authoring and publication)

## 8. Product Principles
- AI accelerates test creation but never replaces human review — all AI-generated test cases must be reviewed/edited before being saved as final, and must be generated against the organisation's currently published, applicable template/configuration.
- Traceability is a first-class concern, not an afterthought — requirements, test cases, runs, and defects must remain linked, and this traceability must hold regardless of how an organisation configures its QA process.
- **TestFlow is a QA operating platform, not a single hard-coded QA process.** TestFlow retains stable, platform-controlled semantics where execution, traceability, historical integrity, AI validation, or reporting depend on them; everything else — QA process, document structure, document lifecycle/approval, project policy, and release readiness — is defined and governed by each organisation within the boundaries TestFlow permits. This is the foundational configuration hierarchy: TestFlow System Semantics → Organisation QA Operating Model → Project Effective QA Configuration → Document/Execution Instance. A lower level may only configure what the level above explicitly permits. **A Project does not own an independent QA process: it inherits a specific published Organisation QA Operating Model version, and "Project Effective QA Configuration" is that inherited version plus only the explicit, permitted Project Exceptions applied on top of it** (clarified terminology, CHANGE-001; see `product-decisions.md` PD-056).

**TestFlow is delivery-methodology neutral (CHANGE-002).** TestFlow does not model or enforce Scrum, Kanban, Waterfall, or other development methodologies. Where QA artifacts require contextual scoping, TestFlow uses lightweight, methodology-neutral **QA Scope** metadata. Organisations may optionally define their preferred scope terminology (e.g., "Sprint," "Phase," "Cycle") as descriptive UI copy only — it never changes system behaviour (`product-decisions.md` PD-064).
- Sensible defaults come first — organisations are not required to configure their QA Operating Model manually before getting value from the product. A recommended starting configuration (Standard QA) can be adopted instantly; manual configuration is available but not the primary onboarding path.
- The platform is multi-tenant and built to scale to an unlimited number of teams/projects.
- AI usage is optional — teams can operate without configuring AI provider keys if they choose not to use AI features.

## 9. High-Level Success Criteria
- QA teams can complete the full workflow — requirement → AI-assisted test case → suite → execution → defect → report — within TestFlow AI without needing external tools for these functions.
- Test case authoring time is measurably reduced through AI generation.
- Every executed test result can be traced back to its originating requirement, regardless of an organisation's QA configuration.
- Organisations can adopt a working QA Operating Model (via a starting preset) within minutes of creating an organisation, without needing product/engineering support, and can subsequently refine it through configuration rather than support requests.

## 10. Current Scope Boundaries
- MVP supports manual test execution only; automated test execution is a future capability.
- MVP includes native defect tracking; integration with external defect trackers is intended for later (see Open Questions in prd.md for a scope conflict that needs resolution).
- Reporting is on-demand only in MVP; scheduled/automated report distribution is postponed.
- Roles are fixed in MVP; fully custom/configurable roles and permissions are postponed (organisation QA configuration authority is layered onto the existing fixed roles via permission checkpoints, not via a custom-role builder — ORG-QA-DEC-011).
- AI generation from free-text task descriptions is postponed; MVP supports AI generation from requirements only.
- A generic workflow/BPM engine, an open-ended quality-gate rules language, and arbitrary organisation-defined custom document types are explicitly out of scope for MVP — the QA Operating Model is built from a bounded set of TestFlow-understood configuration shapes, not a general-purpose process builder (ORG-QA-DEC-004, ORG-QA-DEC-010).