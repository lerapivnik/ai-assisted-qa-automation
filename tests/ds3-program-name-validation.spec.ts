import dotenv from 'dotenv';
import { expect, test, type Locator, type Page } from '@playwright/test';

dotenv.config();

/** Jira does not define a max length. The live form has no HTML maxLength. */
const ASSUMED_PROGRAM_NAME_LENGTH = 255;

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

function newProgramDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function editProgramDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Edit Program' });
}

function programNameField(page: Page): Locator {
  return newProgramDialog(page).getByLabel('Program Name');
}

function descriptionField(page: Page): Locator {
  return newProgramDialog(page).getByLabel('Description');
}

function createButton(page: Page): Locator {
  return newProgramDialog(page).getByRole('button', { name: 'Create' });
}

function programRow(page: Page, programName: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByRole('button', { name: `Edit ${programName}`, exact: true }),
  });
}

function programInList(page: Page, programName: string): Locator {
  return programRow(page, programName).locator('p').first();
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
}

async function openCreateForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  await expect(newProgramDialog(page)).toBeVisible();
}

async function createProgram(
  page: Page,
  programName: string,
  description = '',
): Promise<void> {
  await openCreateForm(page);
  await programNameField(page).fill(programName);
  if (description) {
    await descriptionField(page).fill(description);
  }
  await createButton(page).click();
  await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
  await expect(programInList(page, programName)).toBeVisible();
}

async function submitCreateForm(page: Page): Promise<void> {
  await createButton(page).click();
}

test.describe('Program name validation and duplicate prevention', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await openPrograms(page);
    });

    test('TC-001: program name with special characters is accepted and saved', async ({
      page,
    }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = uniqueName('Advanced informatics and AI program');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-002: program name with accented characters is accepted', async ({ page }) => {
      const programName = uniqueName("Programme d'Été 2026");
      const description = uniqueName('Summer program in French');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-003: whitespace-only program name is rejected and form is not submitted', async ({
      page,
    }) => {
      await openCreateForm(page);
      await programNameField(page).fill('   ');
      await descriptionField(page).fill(uniqueName('Valid description'));

      await expect(createButton(page)).toBeDisabled();
      await expect(newProgramDialog(page)).toBeVisible();
    });

    test('TC-004: duplicate program name is accepted on create', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      await createProgram(page, programName, uniqueName('Original program'));

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(uniqueName('Duplicate attempt'));
      await expect(newProgramDialog(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programRow(page, programName)).toHaveCount(2);
    });

    test('TC-005: empty program name prevents form submission', async ({ page }) => {
      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue('');
      await descriptionField(page).fill(uniqueName('Description without name'));

      await expect(createButton(page)).toBeDisabled();
      await expect(newProgramDialog(page)).toBeVisible();
    });

    test('TC-006: duplicate check is case-sensitive on create', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const caseVariant = programName.toLowerCase();
      await createProgram(page, programName, uniqueName('Original'));

      await openCreateForm(page);
      await programNameField(page).fill(caseVariant);
      await descriptionField(page).fill(uniqueName('Case variation test'));
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programRow(page, programName)).toHaveCount(1);
      await expect(programRow(page, caseVariant)).toHaveCount(1);
    });

    test('TC-007: leading and trailing whitespace is trimmed before save', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const paddedName = `  ${programName}  `;
      await createProgram(page, programName, uniqueName('Original'));

      await openCreateForm(page);
      await programNameField(page).fill(paddedName);
      await descriptionField(page).fill(uniqueName('Whitespace padding test'));
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programRow(page, programName)).toHaveCount(2);
    });

    test('TC-008: program name at 255 characters is accepted', async ({ page }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      const description = uniqueName('Max length boundary test');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-009: program name longer than 255 characters is accepted', async ({ page }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH + 1);
      const description = uniqueName('Over limit test');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
      await expect(newProgramDialog(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
    });

    test('TC-010: program name with HTML/script tags is stored as plain text', async ({
      page,
    }) => {
      let dialogOpened = false;
      page.on('dialog', async (dialog) => {
        dialogOpened = true;
        await dialog.dismiss();
      });

      const programName = uniqueName("<script>alert('xss')</script>");
      const description = uniqueName('XSS test description');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      expect(dialogOpened).toBe(false);
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-011: program name with only special characters is accepted', async ({ page }) => {
      const programName = uniqueName('---');
      const description = uniqueName('Special chars only name');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-012: duplicate prevention does not block edit rename to existing name', async ({
      page,
    }) => {
      const existingName = uniqueName('Web Development 2026');
      const otherName = uniqueName('Data Science 2026');
      await createProgram(page, existingName);
      await createProgram(page, otherName);

      await page.getByRole('button', { name: `Edit ${otherName}`, exact: true }).click();
      const dialog = editProgramDialog(page);
      await dialog.getByLabel('Program Name').fill(existingName);
      await dialog.getByRole('button', { name: 'Save' }).click();

      await expect(editProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(page.getByRole('button', { name: `Edit ${otherName}`, exact: true })).toHaveCount(
        0,
      );
      await expect(programRow(page, existingName)).toHaveCount(2);
    });

    test('TC-013: rapid double-click on Create produces duplicate program records', async ({
      page,
    }) => {
      const programName = uniqueName('Double Click Program');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await createButton(page).dblclick();

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programRow(page, programName)).toHaveCount(2);
    });

    test('TC-014: tab and newline characters in Program Name are normalized on save', async ({
      page,
    }) => {
      const suffix = String(Date.now());
      const rawName = `DS3\tTab\n${suffix}`;
      const savedName = `DS3\tTab ${suffix}`;

      await openCreateForm(page);
      await programNameField(page).fill(rawName);
      await descriptionField(page).fill(uniqueName('Tab newline test'));
      await submitCreateForm(page);

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(
        page.getByRole('button', { name: `Edit ${savedName}`, exact: true }),
      ).toBeVisible();
    });
  });
});
