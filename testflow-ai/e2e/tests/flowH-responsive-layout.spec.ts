import { expect, test, type Page } from '@playwright/test';
import { NO_SESSION } from './helpers';

/**
 * FLOW H — RESPONSIVE LAYOUT. Every screen must fill the browser window and never scroll
 * horizontally, from a phone width up to a large desktop. (A visible/headed run must also use
 * the real window size rather than a fixed 1280x720 page — see playwright.config.ts.)
 * Signed-in screens run as the dedicated tester; the public screens run signed out.
 */
const WIDTHS = [375, 600, 768, 1024, 1280, 1920, 2560];

async function expectFillsWindowWithoutHorizontalScroll(page: Page, label: string): Promise<void> {
  const m = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    // The main content area (or, on pages without one, the header) must reach the right edge.
    rightEdge: Math.max(
      ...Array.from(document.querySelectorAll('main, header')).map((el) => el.getBoundingClientRect().right),
    ),
  }));
  expect(m.documentWidth, `${label}: horizontal scroll (document ${m.documentWidth}px > window ${m.viewport}px)`).toBeLessThanOrEqual(m.viewport);
  expect(m.rightEdge, `${label}: content stops at ${m.rightEdge}px in a ${m.viewport}px window`).toBeGreaterThanOrEqual(m.viewport - 1);
}

test.describe('public screens (signed out)', () => {
  test.use(NO_SESSION);

  test('Flow H — public screens fill the window at every width', { tag: ['@regression'] }, async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/login', '/signup']) {
        await page.goto(route);
        await expectFillsWindowWithoutHorizontalScroll(page, `${route} @${width}px`);
      }
    }
  });
});

test('Flow H — signed-in screens fill the window at every width', { tag: ['@regression', '@critical'] }, async ({ page }) => {
  test.setTimeout(180_000);
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/subscription/success', '/subscription', '/qa-setup', '/app', '/projects']) {
      await page.goto(route);
      await page.locator('main, header').first().waitFor();
      await expectFillsWindowWithoutHorizontalScroll(page, `${route} @${width}px`);
    }
  }
});

test('Flow H — the sidebar collapses to its icon rail on a narrow window and is open on a wide one', { tag: ['@regression'] }, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/projects');
  await expect(page.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible();
  await expect(page.getByText('QA Operating Model')).toBeVisible();

  await page.setViewportSize({ width: 600, height: 900 });
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await expect(page.getByText('QA Operating Model')).toBeHidden();
});
