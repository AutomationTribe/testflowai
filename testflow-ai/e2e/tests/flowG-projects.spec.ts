import { expect, test } from '@playwright/test';
import { TESTER } from '../testerUser';
import { NO_SESSION, createProjectsViaApi, login, resetTesterProjects, signUp } from './helpers';

/**
 * FLOW G — PROJECTS: Empty State → Create Project → Projects List (FR-PRJ-001, FR-PRJ-004,
 * FR-QAOM-012). Runs against the real backend/database; no mocked data.
 *
 * Unless a test says otherwise it starts ALREADY SIGNED IN as the dedicated tester (see
 * testerUser.ts / global-setup.ts) and first puts that account back to "no projects"
 * (resetTesterProjects) — no sign-up step. Role-specific visibility and cross-organisation
 * isolation are covered by the backend integration tests (a QA Tester cannot be created through the
 * UI yet — no invitation flow).
 */
test.describe('signed in as the dedicated tester', () => {
  test.beforeEach(async ({ page }) => {
    await resetTesterProjects(page);
  });

  test('Flow G — empty state → create a project → it appears in the list, pinned to Standard QA v1', { tag: ['@critical', '@regression'] }, async ({ page }) => {
    await page.goto('/projects');

    // Empty state: the dedicated tester starts with no projects.
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
    await expect(page.getByText('0 TOTAL')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse QA Configurations' })).toBeVisible();

    // Create Project modal.
    await page.getByRole('button', { name: 'New Project' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create Project' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/project name/i)).toBeFocused();
    await expect(dialog.getByText('Standard QA', { exact: true })).toBeVisible();
    await expect(dialog.getByText('(Organization default)', { exact: true })).toBeVisible();

    await dialog.getByLabel(/project name/i).fill('Mobile Banking App');
    await dialog.getByLabel(/description/i).fill('Retail banking mobile application');
    await dialog.getByRole('button', { name: 'Create Project' }).click();

    // Populated list.
    await expect(dialog).toBeHidden();
    const row = page.getByRole('row', { name: /Mobile Banking App/ });
    await expect(row).toBeVisible();
    await expect(row).toContainText('PRJ-001');
    await expect(row).toContainText('Retail banking mobile application');
    await expect(row).toContainText('Standard QA v1');
    await expect(row).toContainText('Active');
    await expect(row).toContainText(TESTER.name);
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeHidden();
    await expect(page.getByRole('button', { name: /All Projects \(1\)/ })).toBeVisible();

    // It is still there after a reload (real persistence, not client state).
    await page.reload();
    await expect(page.getByRole('row', { name: /Mobile Banking App/ })).toBeVisible();
  });

  test('Flow G — a second project gets the next code and the list shows newest first', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/projects');

    for (const name of ['First Project', 'Second Project']) {
      await page.getByRole('button', { name: 'New Project' }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Create Project' });
      await dialog.getByLabel(/project name/i).fill(name);
      await dialog.getByRole('button', { name: 'Create Project' }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('row', { name })).toBeVisible();
    }

    const rows = page.getByRole('row');
    await expect(rows.nth(1)).toContainText('Second Project');
    await expect(rows.nth(1)).toContainText('PRJ-002');
    await expect(rows.nth(2)).toContainText('First Project');
    await expect(rows.nth(2)).toContainText('PRJ-001');
  });

  test('Flow G — Create Project requires a name and Cancel creates nothing', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/projects');

    await page.getByRole('button', { name: 'New Project' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create Project' });
    await dialog.getByRole('button', { name: 'Create Project' }).click();
    await expect(dialog.getByText('Project name is required.')).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
  });

  test('Flow G — the sidebar links Dashboard and Projects both ways', { tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/app');

    await page.getByRole('link', { name: 'Projects' }).click();
    await page.waitForURL('**/projects');
    await expect(page.getByRole('heading', { name: /^Projects\b/ })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/app');
  });

  test('Flow G — the list paginates: 12 projects at 10 per page, Next/Previous, and rows per page', { tag: ['@critical', '@regression'] }, async ({ page }) => {
    // 12 projects created through the API (fast setup — creation through the UI is covered above).
    const names = Array.from({ length: 12 }, (_, index) => `Pagination Project ${String(index + 1).padStart(2, '0')}`);
    await createProjectsViaApi(page, names);
    await page.goto('/projects');
    const table = page.getByRole('table', { name: 'Projects' });
    const previous = page.getByRole('button', { name: 'Previous page' });
    const next = page.getByRole('button', { name: 'Next page' });

    // Page 1: the 10 newest (12 down to 03).
    await expect(page.getByText('Showing 1–10 of 12 projects')).toBeVisible();
    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(11); // header + 10
    await expect(table.getByRole('row').nth(1)).toContainText('Pagination Project 12');
    await expect(table.getByRole('row').nth(10)).toContainText('Pagination Project 03');
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();

    // Page 2: the 2 oldest (02 and 01).
    await next.click();
    await expect(page.getByText('Showing 11–12 of 12 projects')).toBeVisible();
    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(3); // header + 2
    await expect(table.getByRole('row').nth(1)).toContainText('Pagination Project 02');
    await expect(table.getByRole('row').nth(2)).toContainText('Pagination Project 01');
    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();

    // Previous goes back to the same first page.
    await previous.click();
    await expect(page.getByText('Showing 1–10 of 12 projects')).toBeVisible();
    await expect(table.getByRole('row').nth(1)).toContainText('Pagination Project 12');

    // 25 rows per page shows everything on one page.
    await page.getByLabel('Rows per page').selectOption('25');
    await expect(page.getByText('Showing 1–12 of 12 projects')).toBeVisible();
    await expect(page.getByText('Page 1 of 1')).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(13); // header + 12
    await expect(next).toBeDisabled();
    await expect(previous).toBeDisabled();
  });

  test('Flow G — search narrows the list and returns to page 1', { tag: ['@regression'] }, async ({ page }) => {
    await createProjectsViaApi(page, [...Array.from({ length: 11 }, (_, index) => `Filler ${index + 1}`), 'Needle Project']);
    await page.goto('/projects');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Page 2 of 2')).toBeVisible();

    await page.getByLabel('Search projects').fill('needle');

    await expect(page.getByText('Showing 1–1 of 1 project')).toBeVisible();
    await expect(page.getByText('Page 1 of 1')).toBeVisible();
    await expect(page.getByRole('row', { name: /Needle Project/ })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Projects' }).getByRole('row')).toHaveCount(2); // header + 1
  });
});

test.describe('explicitly NOT using the dedicated tester', () => {
  test.use(NO_SESSION);

  test('Flow G — an organisation without an active trial/subscription cannot use Projects', { tag: ['@regression'] }, async ({ page }) => {
    await signUp(page); // a brand-new, unsubscribed account is the whole point of this test
    await page.goto('/projects');
    await page.waitForURL('**/subscription-required');
  });

  test('Flow G — a registered user logs in, sees the empty state, creates 5 projects in one session and sees them all in the table', { tag: ['@critical', '@regression'] }, async ({ page }) => {
    // Many steps: let Playwright scale the timeout (it also grows with the slow-motion presets).
    test.slow();

    // The dedicated tester is the already-registered user: they come back and log in through the
    // real login screen (nothing is pre-signed-in in this describe block).
    await page.goto('/login');
    await login(page, { ...TESTER });
    await page.waitForURL('**/app');
    await resetTesterProjects(page); // known empty state, same session
    await page.getByRole('link', { name: 'Projects' }).click();
    await page.waitForURL('**/projects');

    // The empty state shows for an organisation with no projects.
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeVisible();
    await expect(page.getByText('0 TOTAL')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Project' })).toHaveCount(2);

    // Create 5 projects back to back without ever logging out.
    const names = ['Mobile Banking App', 'Website Redesign', 'API Platform', 'BI & Reporting', 'Legacy Banking Backend'];
    for (const [index, name] of names.entries()) {
      await page.getByRole('button', { name: 'New Project' }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Create Project' });
      await dialog.getByLabel(/project name/i).fill(name);
      await dialog.getByLabel(/description/i).fill(`Description for ${name}`);
      await dialog.getByRole('button', { name: 'Create Project' }).click();

      await expect(dialog).toBeHidden();
      await expect(page.getByRole('row', { name })).toBeVisible();
      // Still the same signed-in session on the same page — never bounced to login.
      await expect(page).toHaveURL(/\/projects$/);
      await expect(page.getByRole('button', { name: new RegExp(`All Projects \\(${index + 1}\\)`) })).toBeVisible();
    }

    // All 5 projects are in the table: header row + 5 rows, newest first, with real codes and data.
    const table = page.getByRole('table', { name: 'Projects' });
    await expect(table.getByRole('row')).toHaveCount(6);
    const newestFirst = [...names].reverse();
    for (const [position, name] of newestFirst.entries()) {
      const row = table.getByRole('row').nth(position + 1);
      const code = `PRJ-00${names.length - position}`;
      await expect(row).toContainText(name);
      await expect(row).toContainText(code);
      await expect(row).toContainText(`Description for ${name}`);
      await expect(row).toContainText('Standard QA v1');
      await expect(row).toContainText('Active');
      await expect(row).toContainText(TESTER.name);
    }
    await expect(page.getByText('Showing 1–5 of 5 projects')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeHidden();
  });
});
