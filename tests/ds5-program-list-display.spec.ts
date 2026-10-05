import dotenv from 'dotenv';
import { expect, test, type Locator, type Page } from '@playwright/test';

dotenv.config();

const ASSUMED_PROGRAM_NAME_LENGTH = 255;
const SHARED_ENV_HAS_PROGRAMS =
  'Shared test environment already contains programs; empty-state cases are skipped.';

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

function nameOfLength(length: number): string {
  const suffix = ` ${Date.now()}`;
  return `${'A'.repeat(length - suffix.length)}${suffix}`;
}

function descriptionOfLength(length: number): string {
  const suffix = ` ${Date.now()}`;
  return `${'D'.repeat(length - suffix.length)}${suffix}`;
}

function newProgramDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function editProgramDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Edit Program' });
}

function programRow(page: Page, programName: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByRole('button', { name: `Edit ${programName}`, exact: true }),
  });
}

function programNameInList(page: Page, programName: string): Locator {
  return programRow(page, programName).locator('p').first();
}

function deleteButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Delete ${programName}`, exact: true });
}

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(requireEnv('DIDAXIS_EMAIL'));
  await page.getByLabel('Password').fill(requireEnv('DIDAXIS_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function openPrograms(page: Page): Promise<void> {
  await page.goto('/programs');
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('table')).toBeVisible({ timeout: 60_000 });
}

async function waitForProgramListed(page: Page, programName: string): Promise<void> {
  const edit = page.getByRole('button', { name: `Edit ${programName}`, exact: true });
  await expect(edit).toBeVisible({ timeout: 60_000 });
  await edit.scrollIntoViewIfNeeded();
}

async function createProgram(
  page: Page,
  programName: string,
  description = '',
): Promise<void> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = newProgramDialog(page);
  await dialog.getByLabel('Program Name').fill(programName);
  if (description) {
    await dialog.getByLabel('Description').fill(description);
  }
  await dialog.getByRole('button', { name: 'Create' }).click();
  await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
  await waitForProgramListed(page, programName);
  await expect(programNameInList(page, programName)).toBeVisible();
}

async function deleteProgram(page: Page, programName: string): Promise<void> {
  const button = deleteButton(page, programName);
  await button.scrollIntoViewIfNeeded();

  const handled = new Promise<void>((resolve) => {
    page.once('dialog', async (dialog) => {
      await dialog.accept();
      resolve();
    });
  });

  await button.click();
  await handled;

  await expect(deleteButton(page, programName)).toHaveCount(0, { timeout: 30_000 });
}

async function orderedNamesForBatch(page: Page, batchId: string): Promise<string[]> {
  const editPattern = new RegExp(`^Edit .+${batchId}$`);
  await expect(page.getByRole('button', { name: editPattern }).first()).toBeVisible({
    timeout: 60_000,
  });

  const rows = page.getByRole('row').filter({
    has: page.getByRole('button', { name: editPattern }),
  });
  await expect(rows.first()).toBeVisible({ timeout: 60_000 });
  const count = await rows.count();
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const nameLine = await rows.nth(i).locator('p').first().innerText();
    if (nameLine.includes(batchId)) {
      names.push(nameLine.trim());
    }
  }
  return names;
}

test.describe('Program list filtering and display', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await openPrograms(page);
    });

    test('TC-001: program list displays name and description for each existing program', async ({
      page,
    }) => {
      const webDev = uniqueName('Web Development 2026');
      const dataScience = uniqueName('Data Science 2026');
      const webDesc = uniqueName('Full-stack web development program');
      const dataDesc = uniqueName('Machine learning and analytics program');

      await createProgram(page, webDev, webDesc);
      await createProgram(page, dataScience, dataDesc);

      await expect(programRow(page, webDev)).toBeVisible();
      await expect(programRow(page, webDev).locator('p').nth(1)).toHaveText(webDesc);
      await expect(programRow(page, dataScience)).toBeVisible();
      await expect(programRow(page, dataScience).locator('p').nth(1)).toHaveText(dataDesc);
    });

    test('TC-002: empty state message and create prompt are shown when no programs exist', async () => {
      test.skip(true, SHARED_ENV_HAS_PROGRAMS);
    });

    test('TC-003: create-first-program prompt opens the New Program dialog', async () => {
      test.skip(true, SHARED_ENV_HAS_PROGRAMS);
    });

    test('TC-004: program with empty description displays only the name line in the list', async ({
      page,
    }) => {
      const programName = uniqueName('Data Science 2026');
      await createProgram(page, programName);

      const row = programRow(page, programName);
      await expect(row).toBeVisible();
      await expect(programNameInList(page, programName)).toHaveText(programName);
      await expect(row.locator('p')).toHaveCount(1);
    });

    test('TC-014: Programs page shows table layout and row management actions', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName, uniqueName('Row actions probe'));

      await expect(page.getByRole('columnheader', { name: 'Program' })).toBeVisible();
      await expect(page.getByRole('table')).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Edit ${programName}`, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: `Delete ${programName}`, exact: true }),
      ).toBeVisible();
    });

    test('TC-006: program list does not show stale data after a program is deleted', async ({
      page,
    }) => {
      const webDev = uniqueName('Web Development 2026');
      const dataScience = uniqueName('Data Science 2026');
      await createProgram(page, webDev, uniqueName('Web stack'));
      await createProgram(page, dataScience, uniqueName('Data stack'));

      await deleteProgram(page, dataScience);

      await expect(deleteButton(page, dataScience)).toHaveCount(0);
      await expect(programNameInList(page, webDev)).toBeVisible();
    });

    test('TC-007: program list does not show duplicate entries after creating a program once', async ({
      page,
    }) => {
      const programName = uniqueName('Cloud Computing 2026');
      await createProgram(page, programName, uniqueName('Cloud curriculum'));

      await expect(programRow(page, programName)).toHaveCount(1);
    });

    test('TC-015: Programs page has no search or filter controls', async ({ page }) => {
      await expect(page.getByPlaceholder(/search/i)).toHaveCount(0);
      await expect(page.getByRole('button', { name: /filter/i })).toHaveCount(0);
      await expect(page.getByRole('textbox', { name: /search/i })).toHaveCount(0);
    });

    test('TC-008: program list displays programs with special characters correctly', async ({
      page,
    }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = uniqueName("Programme avancé d'informatique");
      await createProgram(page, programName, description);

      await expect(programRow(page, programName)).toBeVisible();
      await expect(programRow(page, programName).locator('p').nth(1)).toHaveText(description);
    });

    test('TC-009: program list handles a large number of programs via scrollable table', async ({
      page,
    }) => {
      const startedAt = Date.now();
      await expect(page.getByRole('table')).toBeVisible({ timeout: 30_000 });
      await page.getByRole('table').evaluate((table) => {
        table.scrollTop = table.scrollHeight;
      });
      await expect(page.getByRole('columnheader', { name: 'Program' })).toBeVisible();
      expect(Date.now() - startedAt).toBeLessThan(60_000);
      expect(await page.getByRole('row').count()).toBeGreaterThanOrEqual(50);
    });

    test('TC-010: program with long name and description appears in the list', async ({
      page,
    }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      const description = descriptionOfLength(500);
      await createProgram(page, programName, description);

      const row = programRow(page, programName);
      await expect(row).toBeVisible();
      await expect(programNameInList(page, programName)).toHaveText(programName);
      const descLine = row.locator('p').nth(1);
      await expect(descLine).toBeVisible();
      await expect(descLine).toHaveAttribute('data-line-clamp', 'true');
    });

    test('TC-011: program list updates immediately after editing a program', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = uniqueName('Web Development 2026 - Updated');
      await createProgram(page, programName, uniqueName('Original curriculum'));

      await page.getByRole('button', { name: `Edit ${programName}`, exact: true }).click();
      const dialog = editProgramDialog(page);
      await dialog.getByLabel('Program Name').fill(updatedName);
      await dialog.getByRole('button', { name: 'Save' }).click();
      await expect(editProgramDialog(page)).toBeHidden({ timeout: 45_000 });

      await expect(programNameInList(page, updatedName)).toBeVisible();
      await expect(deleteButton(page, programName)).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: `Edit ${updatedName}`, exact: true }),
      ).toBeVisible();
    });

    test('TC-012: empty state transitions to list view after creating the first program', async () => {
      test.skip(true, SHARED_ENV_HAS_PROGRAMS);
    });

    test('TC-013: program list sort order is stable across refresh for a batch of programs', async ({
      page,
    }) => {
      const batchId = String(Date.now());
      const alpha = `Alpha Program ${batchId}`;
      const beta = `Beta Program ${batchId}`;
      const gamma = `Gamma Program ${batchId}`;

      await createProgram(page, alpha);
      await createProgram(page, beta);
      await createProgram(page, gamma);

      const firstOrder = await orderedNamesForBatch(page, batchId);
      expect(firstOrder).toHaveLength(3);
      expect(new Set(firstOrder)).toEqual(new Set([alpha, beta, gamma]));

      await page.reload();
      await openPrograms(page);
      await waitForProgramListed(page, alpha);
      const secondOrder = await orderedNamesForBatch(page, batchId);

      expect(secondOrder).toEqual(firstOrder);
    });

    test('TC-016: duplicate program names appear as separate rows', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      await createProgram(page, programName, uniqueName('First duplicate'));
      await createProgram(page, programName, uniqueName('Second duplicate'));

      await expect(programRow(page, programName)).toHaveCount(2);
      await expect(deleteButton(page, programName)).toHaveCount(2);
    });
  });

  test('TC-005: unauthenticated user cannot view the program list', async ({ page }) => {
    await page.goto('/programs');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Programs' })).toHaveCount(0);
    await expect(page.getByRole('table')).toHaveCount(0);
  });
});
