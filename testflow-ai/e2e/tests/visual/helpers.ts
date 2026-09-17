import type { Locator } from '@playwright/test';

/**
 * Conventions for keeping visual-regression tests deterministic (see
 * playwright.visual.config.ts for the viewport/animation/tolerance settings
 * that apply to every test in this directory).
 *
 * A screen with dynamic content (a generated org name/ID, a timestamp, a
 * signed-in user's real name) is NOT a good visual-regression candidate as a
 * whole-page screenshot — the pixel diff will "fail" on every run for reasons
 * that have nothing to do with a real visual regression. Two ways to handle it,
 * in order of preference:
 *
 * 1. Screenshot a specific, static region instead of the full page
 *    (`locator.screenshot()` / `expect(locator).toHaveScreenshot()`) — e.g. a
 *    card's layout without the dynamic text inside it.
 * 2. Mask the dynamic element(s) via the `mask` option below, which paints over
 *    them with a solid box before comparing — the surrounding layout is still
 *    checked, the unstable content is not.
 *
 * Never widen `maxDiffPixelRatio` in the config as a workaround for dynamic
 * content — that hides real regressions everywhere, not just in the unstable
 * region.
 */
export function maskDynamicRegions(locators: Locator[]): { mask: Locator[] } {
  return { mask: locators };
}
