## PD-011 — Requirements Import/Sync Timing

**Decision:** Requirements import/sync from external tools is postponed to Post-MVP. MVP supports native requirement authoring only.

**Reason:** Keeps MVP scope focused on the core native workflow; import/sync introduces external integration considerations that are not necessary for an initial usable product.

**Alternatives Considered:**
- Include import/sync in MVP alongside native authoring.

**Product Impact:** Requirements Management, MVP Scope, Post-MVP Scope.

**Status:** Approved

---

## PD-012 — Test Plan Timing

**Decision:** The "test plan" concept, distinct from a test run, is postponed to Post-MVP. MVP execution is organized directly through test suites and test runs.

**Reason:** A separate test plan entity adds planning-layer complexity that is not required for an initial usable execution workflow; suites and runs are sufficient for MVP.

**Alternatives Considered:**
- Include test plan as a distinct entity in MVP.

**Product Impact:** Test Execution, Test Runs, MVP Scope, Post-MVP Scope.

**Status:** Approved

---

## PD-013 — Admin Role Scope

**Decision:** The Admin role is scoped per organisation, not system-wide.

**Reason:** Aligns with the Organisation → Projects structure (PD-001); each organisation manages its own administration independently.

**Alternatives Considered:**
- System-wide Admin role across all organisations.
- Both a system-wide and a per-organisation Admin role.

**Product Impact:** Users, Roles, Permissions, Organisation structure.

**Status:** Approved