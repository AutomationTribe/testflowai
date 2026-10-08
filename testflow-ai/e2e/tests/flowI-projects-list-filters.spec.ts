import { expect, test } from '@playwright/test';
import {
  NO_SESSION,
  createProjectsViaApi,
  publishQaConfigurationViaApi,
  resetTesterProjects,
  setProjectStatusViaApi,
  signUp,
} from './helpers';

/**
 * FLOW I — PROJECTS LIST: STATUS TABS/FILTER, SEARCH BY NAME OR CODE, QA-CONFIGURATION FILTER
 * (FR-PRJ-008, PD-069). Data is set up through the API (fast, not under test); everything asserted is
 * what the user sees and does in the real UI. Starts as the dedicated tester except where noted.
 */
test.describe('signed in as the dedicated tester', () => {
  test.beforeEach(async ({ page }) => {
    await resetTesterProjects(page);
  });

  test('Flow I — status tabs show real counts and the Archived tab / status filter narrow the list', { tag: ['@critical', '@regression'] }, async ({ page }) => {
    const [, , charlie] = await createProjectsViaApi(page, ['Alpha Active', 'Bravo Active', 'Charlie Archived']);
    await setProjectStatusViaApi(page, charlie!.id, 'archived');
    await page.goto('/projects');
    const table = page.getByRole('table', { name: 'Projects' });

    // Tabs: the split of Active / Archived, with the All total.
    await expect(page.getByRole('button', { name: /All Projects \(3\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Active \(2\)/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Archived \(1\)/ })).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(4); // header + 3

    // The Archived tab lists only the archived project, marked Archived.
    await page.getByRole('button', { name: /^Archived \(1\)/ }).click();
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('row').nth(1)).toContainText('Charlie Archived');
    await expect(table.getByRole('row').nth(1)).toContainText('Archived');
    await expect(page.getByText('Showing 1–1 of 1 project')).toBeVisible();

    // The status dropdown does the same job and keeps the tab in step.
    await page.getByLabel('Filter by status').selectOption('active');
    await expect(page.getByRole('button', { name: /^Active \(2\)/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(table).not.toContainText('Charlie Archived');
    await expect(page.getByText('Showing 1–2 of 2 projects')).toBeVisible();

    // Back to All statuses: everything again, and the tab counts did not change while filtering.
    await page.getByLabel('Filter by status').selectOption('all');
    await expect(table.getByRole('row')).toHaveCount(4);
    await expect(page.getByRole('button', { name: /All Projects \(3\)/ })).toBeVisible();
  });

  test('Flow I — search matches the project name (any case) or the project code and Clear filters restores the list', { tag: ['@regression'] }, async ({ page }) => {
    await createProjectsViaApi(page, ['Mobile Banking App', 'Website Redesign', 'API Platform']); // PRJ-001, PRJ-002, PRJ-003
    await page.goto('/projects');
    const table = page.getByRole('table', { name: 'Projects' });
    const search = page.getByLabel('Search projects');

    await search.fill('WEBSITE'); // name, different case
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('row').nth(1)).toContainText('Website Redesign');

    await search.fill('prj-003'); // project code, lower case
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('row').nth(1)).toContainText('API Platform');
    await expect(table.getByRole('row').nth(1)).toContainText('PRJ-003');

    await search.fill('nothing-matches-this');
    await expect(page.getByText('No projects match your filters')).toBeVisible();
    await expect(table).toBeHidden();

    // Clear filters (in the "no match" message) brings every project back and empties the search box.
    await page.getByRole('status').getByRole('button', { name: 'Clear filters' }).click();
    await expect(table.getByRole('row')).toHaveCount(4);
    await expect(search).toHaveValue('');
  });
});

test.describe('explicitly NOT using the dedicated tester', () => {
  // Publishing a second QA configuration changes the whole organisation, so this test needs its own
  // brand-new organisation instead of the shared tester (whose projects must stay on Standard QA v1).
  test.use(NO_SESSION);

  test('Flow I — the QA-configuration filter lists only projects pinned to the chosen version', { tag: ['@regression'] }, async ({ page }) => {
    test.slow();
    await signUp(page);
    await page.goto('/subscription');
    await page.getByRole('button', { name: 'Start Free Trial' }).click();
    await page.waitForURL('**/subscription/success**');

    await createProjectsViaApi(page, ['Pinned To Standard']); // Standard QA v1
    await publishQaConfigurationViaApi(page, 'lightweight'); // organisation's current version becomes Lightweight QA v2
    await createProjectsViaApi(page, ['Pinned To Lightweight']);
    await page.goto('/projects');
    const table = page.getByRole('table', { name: 'Projects' });
    const filter = page.getByLabel('Filter by QA configuration');

    // The filter offers exactly the versions in use, newest first.
    await expect(filter.getByRole('option')).toHaveText(['All QA Configurations', 'Lightweight QA v2', 'Standard QA v1']);
    await expect(table.getByRole('row')).toHaveCount(3);

    await filter.selectOption({ label: 'Standard QA v1' });
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('row').nth(1)).toContainText('Pinned To Standard');
    await expect(table.getByRole('row').nth(1)).toContainText('Standard QA v1');

    await filter.selectOption({ label: 'Lightweight QA v2' });
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('row').nth(1)).toContainText('Pinned To Lightweight');
    await expect(table.getByRole('row').nth(1)).toContainText('Lightweight QA v2');

    await filter.selectOption({ label: 'All QA Configurations' });
    await expect(table.getByRole('row')).toHaveCount(3);
  });
});

