import dotenv from 'dotenv';
import { expect, test, type Locator, type Page } from '@playwright/test';

dotenv.config();

/** DS-1 assumed 255. The app accepts longer names, so 256 is covered as a passing case. */
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

function programNameField(page: Page): Locator {
  return newProgramDialog(page).getByLabel('Program Name');
}

function descriptionField(page: Page): Locator {
  return newProgramDialog(page).getByLabel('Description');
}

function createButton(page: Page): Locator {
  return newProgramDialog(page).getByRole('button', { name: 'Create' });
}

function programInList(page: Page, programName: string): Locator {
  return page.getByRole('table').getByText(programName, { exact: true });
}

async function expectProgramCreated(page: Page, programName: string): Promise<void> {
  await expect(newProgramDialog(page)).toBeHidden({ timeout: 30_000 });
  await expect(programInList(page, programName)).toBeVisible();
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
  await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible();
}

async function openCreateForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: '+ New Program' }).click();
  await expect(newProgramDialog(page)).toBeVisible();
  await expect(programNameField(page)).toBeVisible();
  await expect(descriptionField(page)).toBeVisible();
}

test.describe('Create new academic program', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await openPrograms(page);
    });

    test('TC-001: program creation form displays required fields when opened from Programs page', async ({
      page,
    }) => {
      await openCreateForm(page);

      await expect(programNameField(page)).toBeEditable();
      await expect(descriptionField(page)).toBeEditable();
      await expect(createButton(page)).toBeVisible();
    });

    test('TC-002: new program is created and appears in the program list', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await createButton(page).click();

      await expectProgramCreated(page, programName);
    });

    test('TC-003: program is created with only Program Name filled', async ({ page }) => {
      const programName = uniqueName('Data Science 2026');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await expect(descriptionField(page)).toHaveValue('');
      await createButton(page).click();

      await expectProgramCreated(page, programName);
    });

    test('TC-004: Create button remains disabled when Program Name is empty', async ({ page }) => {
      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue('');

      await expect(createButton(page)).toBeDisabled();
    });

    test('TC-005: program is not created when form is submitted without a name', async ({ page }) => {
      const description = uniqueName('Some description');

      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue('');
      await descriptionField(page).fill(description);

      await expect(createButton(page)).toBeDisabled();
      await expect(programInList(page, description)).toHaveCount(0);
    });

    test('TC-007: program name at 255 characters is accepted', async ({ page }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      const description = uniqueName('Boundary test program');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await expect(programNameField(page)).toHaveValue(programName);
      await createButton(page).click();

      await expectProgramCreated(page, programName);
    });

    test('TC-008: program name longer than 255 characters is accepted', async ({ page }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH + 1);
      const description = uniqueName('Over limit test');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await expect(programNameField(page)).toHaveValue(programName);
      await createButton(page).click();

      await expectProgramCreated(page, programName);
    });

    test('TC-009: program name with special characters is accepted', async ({ page }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = uniqueName('French-language program with accents: été');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await createButton(page).click();

      await expectProgramCreated(page, programName);
    });

    test('TC-010: program name with only whitespace is treated as empty', async ({ page }) => {
      await openCreateForm(page);
      await programNameField(page).fill('   ');

      await expect(createButton(page)).toBeDisabled();
      await expect(newProgramDialog(page)).toBeVisible();
    });

    test('TC-011: closing the modal without saving does not add the program', async ({ page }) => {
      const programName = uniqueName('Unsaved Program');
      const description = uniqueName('This should not be saved');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await newProgramDialog(page).getByRole('button', { name: 'Cancel' }).click();

      await expect(newProgramDialog(page)).toBeHidden();
      await expect(programInList(page, programName)).toHaveCount(0);

      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue(programName);
      await expect(descriptionField(page)).toHaveValue(description);
    });
  });

  test('TC-006: unauthenticated user cannot access program creation form', async ({ page }) => {
    await page.goto('/programs');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New Program' })).toHaveCount(0);
    await expect(newProgramDialog(page)).toHaveCount(0);
  });
});
