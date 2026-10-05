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

function editProgramNameField(page: Page): Locator {
  return editProgramDialog(page).getByLabel('Program Name');
}

function editDescriptionField(page: Page): Locator {
  return editProgramDialog(page).getByLabel('Description');
}

function saveButton(page: Page): Locator {
  return editProgramDialog(page).getByRole('button', { name: 'Save' });
}

function cancelButton(page: Page): Locator {
  return editProgramDialog(page).getByRole('button', { name: 'Cancel' });
}

function programRow(page: Page, programName: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByRole('button', { name: `Edit ${programName}` }),
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
  await expect(programInList(page, programName)).toBeVisible();
}

async function openEditForm(page: Page, programName: string): Promise<void> {
  await page.getByRole('button', { name: `Edit ${programName}` }).click();
  await expect(editProgramDialog(page)).toBeVisible();
}

async function expectProgramSaved(page: Page, programName: string): Promise<void> {
  await expect(editProgramDialog(page)).toBeHidden({ timeout: 45_000 });
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
      const dialog = editProgramDialog(page);

      await expect(editProgramNameField(page)).toHaveValue(programName);
      await expect(editDescriptionField(page)).toHaveValue(description);
      await expect(dialog.getByRole('button', { name: 'Show AI Generation Config' })).toBeVisible();
      await expect(dialog.getByLabel('Total Program Hours')).toBeVisible();
      await expect(dialog.getByLabel('Default Session Hours')).toHaveValue('4');
      await expect(dialog.getByLabel('Default Exam Hours')).toHaveValue('3');
      await expect(dialog.getByLabel('Target Audience')).toBeVisible();
      await expect(dialog.getByLabel('Focus Areas')).toBeVisible();
      await expect(dialog.getByText('Sync/Async Ratio: 70% sync / 30% async')).toBeVisible();
      await expect(cancelButton(page)).toBeVisible();
      await expect(saveButton(page)).toBeVisible();
    });

    test('TC-002: program name update is reflected immediately in the list', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = uniqueName('Web Development 2026 - Updated');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(updatedName);
      await saveButton(page).click();

      await expectProgramSaved(page, updatedName);
      await expect(page.getByRole('button', { name: `Edit ${programName}` })).toHaveCount(0);
      await expect(page.getByRole('alert')).toHaveCount(0);
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

    test('TC-006: Cancel discards unsaved edits and restores saved values on reopen', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const unsavedName = uniqueName('Should Not Be Saved');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(unsavedName);
      await cancelButton(page).click();

      await expect(editProgramDialog(page)).toBeHidden();
      await expect(programInList(page, programName)).toBeVisible();
      await expect(page.getByRole('button', { name: `Edit ${unsavedName}` })).toHaveCount(0);

      await openEditForm(page, programName);
      await expect(editProgramNameField(page)).toHaveValue(programName);
    });

    test('TC-007: duplicate program name is accepted on edit', async ({ page }) => {
      const existingName = uniqueName('Web Development 2026');
      const otherName = uniqueName('Data Science 2026');
      await createProgram(page, existingName);
      await createProgram(page, otherName);

      await openEditForm(page, otherName);
      await editProgramNameField(page).fill(existingName);
      await saveButton(page).click();

      await expectProgramSaved(page, existingName);
      await expect(page.getByRole('button', { name: `Edit ${otherName}` })).toHaveCount(0);
      await expect(programRow(page, existingName)).toHaveCount(2);
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

    test('TC-011: program name with only whitespace keeps Save disabled', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill('   ');

      await expect(saveButton(page)).toBeDisabled();
    });

    test('TC-013: leading and trailing whitespace in Program Name is trimmed on save', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const paddedName = `  ${programName}  `;
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(paddedName);
      await saveButton(page).click();

      await expect(editProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
      await expect(page.getByRole('button', { name: `Edit ${programName}` })).toBeVisible();
    });

    test('TC-014: optional AI fields accept input and save without blocking edit', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      await createProgram(page, programName, 'Base description');
      const dialog = editProgramDialog(page);

      await openEditForm(page, programName);
      await dialog.getByLabel('Target Audience').fill('Career changers, no CS background');
      await dialog.getByLabel('Focus Areas').fill('Python, SQL');
      await expect(saveButton(page)).toBeEnabled();
      await saveButton(page).click();

      await expectProgramSaved(page, programName);
    });

    test('TC-015: closing the dialog with X discards unsaved edits like Cancel', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const unsavedName = uniqueName('Closed Via X');
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(unsavedName);
      await editProgramDialog(page).locator('button.mantine-Modal-close').click();

      await expect(editProgramDialog(page)).toBeHidden();
      await expect(programInList(page, programName)).toBeVisible();
      await expect(page.getByRole('button', { name: `Edit ${unsavedName}` })).toHaveCount(0);

      await openEditForm(page, programName);
      await expect(editProgramNameField(page)).toHaveValue(programName);
    });

    test('TC-016: program name longer than 255 characters is accepted on edit', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const updatedName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH + 1);
      await createProgram(page, programName);

      await openEditForm(page, programName);
      await editProgramNameField(page).fill(updatedName);
      await saveButton(page).click();

      await expectProgramSaved(page, updatedName);
      await expect(editProgramDialog(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
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
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(0);
    await expect(editProgramDialog(page)).toHaveCount(0);
  });
});
