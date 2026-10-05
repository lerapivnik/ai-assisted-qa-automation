import dotenv from 'dotenv';
import { expect, test, type Locator, type Page } from '@playwright/test';

dotenv.config();

/** DS-1 ACs do not define a max length. The live form has no HTML maxLength. */
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

function totalProgramHoursField(page: Page): Locator {
  return newProgramDialog(page).getByLabel('Total Program Hours');
}

function createButton(page: Page): Locator {
  return newProgramDialog(page).getByRole('button', { name: 'Create' });
}

function cancelButton(page: Page): Locator {
  return newProgramDialog(page).getByRole('button', { name: 'Cancel' });
}

function programRow(page: Page, programName: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByRole('button', { name: `Edit ${programName}` }),
  });
}

function programInList(page: Page, programName: string): Locator {
  return programRow(page, programName).locator('p').first();
}

async function expectProgramCreated(page: Page, programName: string): Promise<void> {
  await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
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
      const dialog = newProgramDialog(page);

      await expect(programNameField(page)).toBeEditable();
      await expect(programNameField(page)).toHaveAttribute(
        'placeholder',
        'e.g. Computer Science BSc',
      );
      await expect(descriptionField(page)).toBeEditable();
      await expect(descriptionField(page)).toHaveAttribute('placeholder', 'Brief description');
      await expect(dialog.getByRole('button', { name: 'Show AI Generation Config' })).toBeVisible();
      await expect(dialog.getByLabel('Total Program Hours')).toBeVisible();
      await expect(dialog.getByLabel('Default Session Hours')).toHaveValue('4');
      await expect(dialog.getByLabel('Default Exam Hours')).toHaveValue('3');
      await expect(dialog.getByLabel('Target Audience')).toBeVisible();
      await expect(dialog.getByLabel('Focus Areas')).toBeVisible();
      await expect(dialog.getByText('Sync/Async Ratio: 70% sync / 30% async')).toBeVisible();
      await expect(cancelButton(page)).toBeVisible();
      await expect(createButton(page)).toBeVisible();
      await expect(createButton(page)).toBeDisabled();
    });

    test('TC-002: new program is created and appears in the program list', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');
      const description = 'Full-stack web development program';

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await createButton(page).click();

      await expectProgramCreated(page, programName);
      await expect(programRow(page, programName).locator('p').nth(1)).toHaveText(description);
      await expect(page.getByRole('alert')).toHaveCount(0);
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

    test('TC-005: program is not created when form is submitted without a name', async ({
      page,
    }) => {
      const description = uniqueName('Some description');

      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue('');
      await descriptionField(page).fill(description);

      await expect(createButton(page)).toBeDisabled();
      await expect(page.getByRole('button', { name: `Edit ${description}` })).toHaveCount(0);
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
      await expect(newProgramDialog(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
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

    test('TC-011: closing the modal with Cancel does not add the program and keeps typed values', async ({
      page,
    }) => {
      const programName = uniqueName('Unsaved Program');
      const description = uniqueName('This should not be saved');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await cancelButton(page).click();

      await expect(newProgramDialog(page)).toBeHidden();
      await expect(page.getByRole('button', { name: `Edit ${programName}` })).toHaveCount(0);

      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue(programName);
      await expect(descriptionField(page)).toHaveValue(description);
    });

    test('TC-012: program is created when optional AI generation fields are filled', async ({
      page,
    }) => {
      const programName = uniqueName('AI Config Program');
      const description = 'Full-stack web development program';

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill(description);
      await totalProgramHoursField(page).fill('900');
      await newProgramDialog(page)
        .getByLabel('Target Audience')
        .fill('Career changers, no CS background');
      await newProgramDialog(page)
        .getByLabel('Focus Areas')
        .fill('Python, SQL, Machine Learning');
      await createButton(page).click();

      await expectProgramCreated(page, programName);
      await expect(programRow(page, programName).locator('p').nth(1)).toHaveText(
        'Full-stack web development program900Career changers, no CS backgroundPython, SQL, Machine Learning',
      );
    });

    test('TC-013: leading and trailing whitespace in Program Name is trimmed before save', async ({
      page,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const paddedName = `  ${programName}  `;

      await openCreateForm(page);
      await programNameField(page).fill(paddedName);
      await createButton(page).click();

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programInList(page, programName)).toBeVisible();
      await expect(programInList(page, programName)).toHaveText(programName);
    });

    test('TC-015: duplicate program name is accepted on create', async ({ page }) => {
      const programName = uniqueName('Web Development 2026');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill('Original program');
      await createButton(page).click();
      await expectProgramCreated(page, programName);

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill('Duplicate attempt');
      await createButton(page).click();

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(newProgramDialog(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
      await expect(programRow(page, programName)).toHaveCount(2);
    });

    test('TC-016: rapid double-click on Create produces two program records', async ({ page }) => {
      const programName = uniqueName('Double Click Program');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await createButton(page).dblclick();

      await expect(newProgramDialog(page)).toBeHidden({ timeout: 45_000 });
      await expect(programRow(page, programName)).toHaveCount(2);
    });

    test('TC-017: program creation form is empty after a successful create', async ({ page }) => {
      const programName = uniqueName('Reset After Create');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await descriptionField(page).fill('Should not persist after save');
      await createButton(page).click();
      await expectProgramCreated(page, programName);

      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue('');
      await expect(descriptionField(page)).toHaveValue('');
      await expect(createButton(page)).toBeDisabled();
    });

    test('TC-018: non-numeric Total Program Hours is stripped and does not block create', async ({
      page,
    }) => {
      const programName = uniqueName('Hours Probe');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await totalProgramHoursField(page).fill('abc');
      await expect(totalProgramHoursField(page)).toHaveValue('');
      await expect(createButton(page)).toBeEnabled();

      await totalProgramHoursField(page).fill('-5');
      await expect(totalProgramHoursField(page)).toHaveValue('');
      await expect(createButton(page)).toBeEnabled();
      await expect(newProgramDialog(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);

      await createButton(page).click();
      await expectProgramCreated(page, programName);
    });

    test('TC-019: closing the dialog with X does not add the program and keeps typed values', async ({
      page,
    }) => {
      const programName = uniqueName('Closed via X');

      await openCreateForm(page);
      await programNameField(page).fill(programName);
      await newProgramDialog(page).locator('button.mantine-Modal-close').click();

      await expect(newProgramDialog(page)).toBeHidden();
      await expect(page.getByRole('button', { name: `Edit ${programName}` })).toHaveCount(0);

      await openCreateForm(page);
      await expect(programNameField(page)).toHaveValue(programName);
    });
  });

  test('TC-006: unauthenticated user cannot access program creation form', async ({ page }) => {
    await page.goto('/programs');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New Program' })).toHaveCount(0);
    await expect(newProgramDialog(page)).toHaveCount(0);
  });
});
