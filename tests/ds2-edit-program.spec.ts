import dotenv from 'dotenv';
import { expect, test, type Locator, type Page } from '@playwright/test';

dotenv.config();

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

function programInList(page: Page, programName: string): Locator {
  return page.getByRole('table').getByText(programName, { exact: true });
}

function editProgramNameField(page: Page): Locator {
  return editProgramDialog(page).getByLabel('Program Name');
}

function editDescriptionField(page: Page): Locator {
  return editProgramDialog(page).getByLabel('Description');
}

function saveButton(page: Page): Locator {
  return editProgramDialog(page).getByRole('button', { name: 'Save' });
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
  await expect(newProgramDialog(page)).toBeHidden({ timeout: 30_000 });
  await expect(programInList(page, programName)).toBeVisible();
}

async function openEditForm(page: Page, programName: string): Promise<void> {
  await page.getByRole('button', { name: `Edit ${programName}` }).click();
  await expect(editProgramDialog(page)).toBeVisible();
}

async function expectProgramSaved(page: Page, programName: string): Promise<void> {
  await expect(editProgramDialog(page)).toBeHidden({ timeout: 30_000 });
  await expect(programInList(page, programName)).toBeVisible();
}

test.describe('Edit existing program details', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await openPrograms(page);
    });

    test('TC-001: edit form displays pre-populated program data', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');
      await createProgram(page, programName, description);

      await openEditForm(page, programName);

      await expect(editProgramNameField(page)).toHaveValue(programName);
      await expect(editDescriptionField(page)).toHaveValue(description);
    });

    test('TC-002: program name update is reflected immediately in the list', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = uniqueName('Web Development 2026 - Updated');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(updatedName);
      await saveButton(page).click();

      await expectProgramSaved(page, updatedName);
      await expect(programInList(page, programName)).toHaveCount(0);
    });

    test('TC-003: unchanged fields are preserved when only Description is edited', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');
      const updatedDescription = uniqueName('Updated full-stack curriculum for 2026');
      await createProgram(page, programName, description);

      await openEditForm(page, programName);
      await editDescriptionField(page).fill(updatedDescription);
      await saveButton(page).click();
      await expectProgramSaved(page, programName);

      await openEditForm(page, programName);
      await expect(editProgramNameField(page)).toHaveValue(programName);
      await expect(editDescriptionField(page)).toHaveValue(updatedDescription);
    });

    test('TC-004: description can be cleared while Name remains unchanged', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');
      await createProgram(page, programName, description);

      await openEditForm(page, programName);
      await editDescriptionField(page).fill('');
      await saveButton(page).click();
      await expectProgramSaved(page, programName);

      await openEditForm(page, programName);
      await expect(editProgramNameField(page)).toHaveValue(programName);
      await expect(editDescriptionField(page)).toHaveValue('');
    });

    test('TC-005: Save is disabled when Program Name is cleared', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill('');

      await expect(saveButton(page)).toBeDisabled();
    });

    test('TC-006: Cancel discards unsaved edits', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const unsavedName = uniqueName('Should Not Be Saved');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(unsavedName);
      await editProgramDialog(page).getByRole('button', { name: 'Cancel' }).click();

      await expect(editProgramDialog(page)).toBeHidden();
      await expect(programInList(page, programName)).toBeVisible();
      await expect(programInList(page, unsavedName)).toHaveCount(0);
    });

    test('TC-007: duplicate program name is accepted on edit', async ({ page }) => {
      const existingName = uniqueName('Web Development 2026');
      const otherName = uniqueName('Data Science 2026');
      await createProgram(page, existingName);
      await createProgram(page, otherName);

      await openEditForm(page, otherName);
      await editProgramNameField(page).fill(existingName);
      await saveButton(page).click();

      await expect(editProgramDialog(page)).toBeHidden({ timeout: 30_000 });
      await expect(programInList(page, otherName)).toHaveCount(0);
      await expect(programInList(page, existingName)).toHaveCount(2);
    });

    test('TC-009: program name with special characters is accepted on edit', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = uniqueName('Web Dev & Design — Niveau 2');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(updatedName);
      await saveButton(page).click();

      await expectProgramSaved(page, updatedName);
    });

    test('TC-010: program name at 255 characters is accepted on edit', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(updatedName);
      await saveButton(page).click();

      await expectProgramSaved(page, updatedName);
    });

    test('TC-011: program name with only whitespace is rejected on edit', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill('   ');

      await expect(saveButton(page)).toBeDisabled();
    });

    test('TC-012: concurrent edit by two users shows appropriate conflict handling', async ({
      browser,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const descriptionA = uniqueName('Updated by User A');
      const descriptionB = uniqueName('Updated by User B');

      const setup = await browser.newContext();
      const setupPage = await setup.newPage();
      await login(setupPage);
      await openPrograms(setupPage);
      await createProgram(setupPage, programName, uniqueName('Original description'));
      await setup.close();

      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await login(pageA);
      await login(pageB);
      await openPrograms(pageA);
      await openPrograms(pageB);

      await openEditForm(pageA, programName);
      await openEditForm(pageB, programName);

      await editDescriptionField(pageA).fill(descriptionA);
      await saveButton(pageA).click();
      await expectProgramSaved(pageA, programName);

      await editDescriptionField(pageB).fill(descriptionB);
      const secondSave = pageB.waitForResponse(
        (response) =>
          response.url().includes('/api/programs/') &&
          response.request().method() === 'PATCH',
      );
      await saveButton(pageB).click();
      const response = await secondSave;

      if (response.status() >= 400) {
        await expect(
          pageB.getByText(/conflict|already|error|failed/i),
        ).toBeVisible();
        await expect(editProgramDialog(pageB)).toBeVisible();
      } else {
        await expectProgramSaved(pageB, programName);
      }

      await openEditForm(pageA, programName);
      const finalDescription = await editDescriptionField(pageA).inputValue();
      expect([descriptionA, descriptionB]).toContain(finalDescription);

      await contextA.close();
      await contextB.close();
    });
  });

  test('TC-008: unauthenticated user cannot edit a program', async ({ page }) => {
    await page.goto('/programs');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(0);
    await expect(editProgramDialog(page)).toHaveCount(0);
  });
});
