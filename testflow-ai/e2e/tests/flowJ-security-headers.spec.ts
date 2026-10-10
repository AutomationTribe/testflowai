import { expect, test } from '@playwright/test';
import { NO_SESSION, signUpAndReachQaSetup } from './helpers';

/**
 * FLOW J — frontend security headers and the REPORT-ONLY Content Security Policy
 * (docs/technical/frontend-security-headers.md, AD-031). The CSP is report-only, so a violation never breaks a page; this test
 * is what makes violations visible: it records every `securitypolicyviolation` event across the main journeys and expects none.
 * It runs against whatever the Playwright web server serves (`next dev` here), so the dev-only allowances apply; the
 * production-mode sweep is done against `next build` + `next start` (see the QA notes in PROJECT_STATUS.md).
 */
test.use(NO_SESSION);

interface Violation {
  directive: string;
  blocked: string;
  source: string;
  disposition: string;
}

test('Flow J — headers are present and the main journeys raise zero CSP violations', { tag: ['@regression'] }, async ({ page }) => {
  const violations: Violation[] = [];
  await page.exposeFunction('reportCspViolation', (v: Violation) => violations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      void (window as unknown as { reportCspViolation: (v: unknown) => void }).reportCspViolation({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
        source: `${event.sourceFile}:${event.lineNumber}`,
        disposition: event.disposition,
      });
    });
  });

  // 1. The document response carries the security headers (and not the enforcing CSP or X-Powered-By).
  const response = await page.goto('/login');
  const headers = response!.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
  expect(headers['content-security-policy-report-only']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toBeUndefined();
  expect(headers['x-powered-by']).toBeUndefined();

  // 2. Walk the main journeys: sign-up, trial, QA setup, then Projects (empty state, create dialog, list).
  await signUpAndReachQaSetup(page);
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
  await page.getByRole('button', { name: 'New Project' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Create Project' });
  await expect(dialog.getByText('Standard QA', { exact: true })).toBeVisible();
  await dialog.getByLabel(/project name/i).fill('CSP sweep project');
  await dialog.getByRole('button', { name: 'Create Project' }).click();
  await expect(page.getByRole('row', { name: /CSP sweep project/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('row', { name: /CSP sweep project/ })).toBeVisible();

  // 3. Nothing the app does on those screens may violate the policy.
  expect(violations, `CSP violations: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
});
