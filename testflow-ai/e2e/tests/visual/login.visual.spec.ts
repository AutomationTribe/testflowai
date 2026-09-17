import { expect, test } from '@playwright/test';

/**
 * Foundation/demonstration visual-regression test (see
 * playwright.visual.config.ts and docs/technical/testing.md's Visual
 * Regression section). The Login screen is used as the first example because
 * it has zero dynamic content — no generated names, IDs, or timestamps — so it
 * needs no masking to be a stable baseline, making it the clearest possible
 * demonstration of the mechanism itself before any real screen adopts it.
 *
 * This does NOT establish a baseline for any other TestFlow screen. Adopting
 * visual regression for a specific screen (QA Setup included) is a deliberate
 * decision for whoever owns that screen's conformance — see
 * .claude/agents/design.md.
 */
test('Login screen — visual baseline', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  await expect(page).toHaveScreenshot('login.png');
});
