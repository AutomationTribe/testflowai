import { expect, test } from '@playwright/test';
import { signUp, signUpAndReachQaSetup } from './helpers';

/**
 * FLOW G — PROJECTS: Empty State → Create Project → Projects List (FR-PRJ-001,
 * FR-PRJ-004, FR-QAOM-012). Runs against the real backend/database; no mocked data.
 * Role-specific visibility (Admin / QA Manager / QA Tester) and cross-organisation
 * isolation are covered by the backend integration tests — a QA Tester cannot be
 * created through the UI yet (no invitation flow).
 */
test('Flow G — empty state → create a project → it appears in the list, pinned to Standard QA v1', { tag: ['@critical', '@regression'] }, async ({ page }) => {
  const user = await signUpAndReachQaSetup(page);
  await page.goto('/projects');

  // Empty state: a brand-new organisation has no projects.
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
  await expect(row).toContainText(user.name);
  await expect(page.getByRole('heading', { name: 'No projects yet' })).toBeHidden();
  await expect(page.getByRole('button', { name: /All Projects \(1\)/ })).toBeVisible();

  // It is still there after a reload (real persistence, not client state).
  await page.reload();
  await expect(page.getByRole('row', { name: /Mobile Banking App/ })).toBeVisible();
});

test('Flow G — a second project gets the next code and the list shows newest first', { tag: ['@regression'] }, async ({ page }) => {
  await signUpAndReachQaSetup(page);
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
  await signUpAndReachQaSetup(page);
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
  await signUpAndReachQaSetup(page);
  await page.goto('/app');

  await page.getByRole('link', { name: 'Projects' }).click();
  await page.waitForURL('**/projects');
  await expect(page.getByRole('heading', { name: /^Projects\b/ })).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.waitForURL('**/app');
});

test('Flow G — an organisation without an active trial/subscription cannot use Projects', { tag: ['@regression'] }, async ({ page }) => {
  await signUp(page);
  await page.goto('/projects');
  await page.waitForURL('**/subscription-required');
});
