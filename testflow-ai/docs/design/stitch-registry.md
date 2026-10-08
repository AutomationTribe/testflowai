# Stitch Design Registry

The authoritative mapping from a design's **canonical screen name** to its exact Stitch
identifiers. Approved designs are resolved **from this registry by exact screen ID** — never by
"the newest screen in the Stitch project", never by fuzzy title matching.

- Stitch project: **Test Flow AI** — project ID `6056437425670809929`
  (`projects/6056437425670809929`)
- Screen resource name: `projects/<project ID>/screens/<screen ID>`

## Rules

1. Every Stitch design has a canonical screen name (`<Area> — <Screen>`, e.g. `Projects — List`).
2. When a design is approved, record in the table below: canonical screen name, Stitch project
   ID, Stitch screen ID, approval status, approval date, and the requirement/feature
   association where applicable.
3. Resolve approved designs through this registry and the exact screen ID. Do not assume the
   newest, last-listed, or similarly titled Stitch screen is the approved one. Stitch's
   `list_screens` order is not chronological and has returned an incomplete list.
4. Stitch MCP has no tool to rename an existing screen (only prompt-driven `edit_screens` /
   regenerate). Do not regenerate a screen just to fix its title; the canonical name lives
   here, and the Stitch title is left as-is.
5. If a screen is re-approved after changes, update its row (new date, note the change) rather
   than adding a second row for the same canonical name.

## Approved designs

| Canonical name | Stitch project ID | Stitch screen ID | Status | Approved | Requirement / feature |
|---|---|---|---|---|---|
| Projects — Empty State | 6056437425670809929 | `585484247e734477825bf374a61b60ec` | Approved | Before 2026-10-07 (exact date not recorded); recorded in registry 2026-10-07 | FR-PRJ-001, FR-PRJ-004 — Projects |
| Projects — List | 6056437425670809929 | `b2b302b729534983880869b8e214b6af` | Approved | Before 2026-10-07 (exact date not recorded); recorded in registry 2026-10-07 | FR-PRJ-004 — Projects |
| Projects — Create Project | 6056437425670809929 | `40ac626b6df0487fb0ea0d07bc6d9dfe` | Approved | 2026-10-07 | FR-PRJ-001 (Create Project); QA Configuration field per FR-POL-002 — Projects |

Stitch titles for the three rows above already equal their canonical names, so no rename was
needed.

## Reference images on disk

| Canonical name | Image in the repo | Note |
|---|---|---|
| Projects — Create Project | `approved/projects/create-project.png` (2560×2048) | downloaded from the Stitch screenshot link; byte-identical on re-fetch |
| Projects — List | `approved/projects/list.png` (2560×2048) — **sibling screen** `project list` (`ec89d852…`) | the approved original's screenshot link requires a Google login; this sibling is the design guide the screen was built against (see `approved/projects/README.md`). Replace with the original's export if it becomes available. |
| Projects — Empty State | `approved/projects/empty-state.png` (2560×2048) — **sibling screen** `project empty state` (`a91c29d7…`) | same as above |

Standing instruction (Product Owner, 2026-10-07): going forward every approved screen's
full-size image is saved under `docs/design/approved/<area>/` and listed here.

## Same-area Stitch screens that are NOT registered as approved

These exist in the Stitch project with similar content but are not the approved designs. Do not
implement from them unless the user promotes one by updating this registry.

| Stitch title | Stitch screen ID | Note |
|---|---|---|
| project list | `ec89d85279a24674abc945da5c42bfb0` | Lowercase title; generated after `Projects — List`. Its chrome (TestFlow "QA System" sidebar, Intello Technologies switcher, 5-row table) may differ from `Projects — List` / the Create Project backdrop. Approval status unconfirmed. |
| project empty state | `a91c29d72f574c768d77466d21a65782` | Lowercase title; generated after `Projects — Empty State`. Approval status unconfirmed. |

## Screens approved earlier as PNGs

Account/subscription screens are approved as exported images under
`docs/design/approved/account-subscription/` and predate this registry; they are not yet mapped
to Stitch screen IDs. Add rows here when they next need to be resolved.
