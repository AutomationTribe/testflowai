# Design → Frontend Handoff

How a design becomes a working screen when **design-to-code conversion is done by
an external tool (ChatGPT/Codex)** and **integration is done in this repo**.

The split exists so neither side has to guess: the converter owns *what it looks
like*, this repo owns *what it does*.

| Owned by the converter (ChatGPT/Codex) | Owned in-repo (integration) |
|---|---|
| Markup, layout, spacing, typography, colors | Data fetching, API calls |
| Static content/copy from the design | Session, auth, routing |
| Per-screen presentational components | State, side effects, error handling |
| Responsive behaviour | Unit / API / E2E tests |
| — | Backend, migrations, OpenAPI, QA, security |

## The contract

A converted component MUST be **purely presentational**:

- Props in, callbacks out. No `fetch`, no `apiClient`, no `useSession`, no
  `next/navigation`, no `localStorage`.
- No invented data. If the design shows a number, a name, a date, or an ID, it
  becomes a **prop**, never a hard-coded value. (See CLAUDE.md — fabricated
  telemetry/IDs/claims are not permitted in this product.)
- Styling via the design tokens below (CSS custom properties), not raw hex
  values, so it stays consistent with the rest of the app.
- One file, one default-exported component, TypeScript, `'use client'` at the
  top, explicit `Props` interface.

## Step-by-step

1. **Define the props first (in-repo).** Before conversion, the exact `Props`
   interface for the screen is written here and handed to the converter. This is
   the single most important step — it's what makes the returned component drop
   in without rework.
2. **Convert (ChatGPT/Codex).** Paste the design image + the prompt template
   below + the props interface + the tokens. Ask for exactly one `.tsx` file.
3. **Drop it in.** Save the returned file as
   `frontend/src/components/design/<ScreenName>.tsx`. Everything in that folder
   is understood to be converted-from-design and presentational only.
4. **Integrate (in-repo).** A thin page/container imports it, supplies real data
   and handlers, and owns routing. The converted file is not edited for wiring —
   if it needs different props, the props interface changes and it goes back
   through step 1/2.
5. **Test & verify (in-repo).** Unit tests for the container's behaviour, E2E for
   the journey, then the QA and Security agents per CLAUDE.md rule 20.

## Prompt template for the converter

> Convert the attached design into a single React component.
>
> Hard requirements:
> - TypeScript, `'use client'` at the top, one default export, one file.
> - **Presentational only**: no data fetching, no API calls, no routing, no
>   global state, no browser storage. Props in, callbacks out.
> - Use exactly this props interface — do not add, rename, or remove props:
>   ```ts
>   <PASTE THE PROPS INTERFACE HERE>
>   ```
> - Every piece of dynamic content in the design (names, counts, IDs, dates,
>   statuses) must come from props. Do not hard-code sample data.
> - Style with these CSS custom properties rather than raw colors/sizes where one
>   applies:
>   ```css
>   <PASTE THE TOKENS BLOCK BELOW>
>   ```
> - Icons: inline SVG, monochrome, `stroke="currentColor"`. No emoji, no icon
>   libraries, no external assets.
> - Match the design exactly: layout, spacing, hierarchy, all copy, badges,
>   states, and any selected/active styling. Do not redesign, simplify, or
>   "improve" anything.
> - Inline `style` objects are fine (that's this codebase's existing convention);
>   no Tailwind, no CSS-in-JS libraries, no new dependencies.
>
> Return only the file contents.

## Tokens to paste into the prompt

```css
--color-primary: #001f47;
--color-primary-container: #02346d;
--color-surface: #ffffff;
--color-surface-low: #f4f3f9;
--color-outline-variant: #c3c6d1;
--color-text: #14181f;
--color-text-muted: #4c5566;

--font-ui: 'Hanken Grotesk', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', Consolas, monospace;

--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-6: 24px;

--radius-sm: 4px; --radius-md: 6px;

--sidebar-width-expanded: 220px;
--sidebar-width-collapsed: 56px;
```

## Verifying the result looks right

Design conformance is checked by **screenshotting the running page and comparing
it to the reference**, not by reading the code. A throwaway Playwright spec that
navigates to the screen and calls `page.screenshot()` is the fastest way; delete
it afterwards.

## What still comes back to this repo

Conversion does not remove any of the existing rules: approved requirements still
win over a design where the two conflict (report the conflict rather than
implementing something unsupported), unit tests are still mandatory (rule 19),
and the QA → Security → DevOps gate still applies before deployment (rule 20).
