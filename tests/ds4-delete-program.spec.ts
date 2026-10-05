import dotenv from 'dotenv';
import { expect, test, type Locator, type Page } from '@playwright/test';

dotenv.config();

const ASSUMED_PROGRAM_NAME_LENGTH = 255;
const DELETE_CONFIRM_SNIPPET = 'All its semesters and courses will be removed';

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

function deleteButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Delete ${programName}`, exact: true });
}

function programRow(page: Page, programName: string): Locator {
  return page.getByRole('row').filter({
    has: page.getByRole('button', { name: `Edit ${programName}`, exact: true }),
  });
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
  await expect(programRow(page, programName)).toBeVisible();
}

async function triggerDelete(
  page: Page,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<string> {
  const button = deleteButton(page, programName);
  await button.scrollIntoViewIfNeeded();

  let message = '';
  const dialogHandled = new Promise<void>((resolve) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      message = dialog.message();
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
      resolve();
    });
  });

  await button.click();
  await dialogHandled;
  return message;
}

async function expectProgramAbsent(page: Page, programName: string): Promise<void> {
  await expect(deleteButton(page, programName)).toHaveCount(0, { timeout: 30_000 });
  await expect(programRow(page, programName)).toHaveCount(0);
}

test.describe('Delete program with confirmation', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await openPrograms(page);
    });

    test('TC-001: program is permanently removed after confirming deletion', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'accept');

      await expectProgramAbsent(page, programName);
    });

    test('TC-002: program remains in the list when deletion is cancelled', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'dismiss');

      await expect(deleteButton(page, programName)).toBeVisible();
      await expect(programRow(page, programName)).toBeVisible();
    });

    test('TC-003: confirmation dialog displays the program name and cascade warning', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      const message = await triggerDelete(page, programName, 'dismiss');

      expect(message).toContain(programName);
      expect(message).toContain(DELETE_CONFIRM_SNIPPET);
      expect(message.toLowerCase()).toContain('cannot be undone');
      await expect(deleteButton(page, programName)).toBeVisible();
    });

    test('TC-004: program is not deleted when confirmation dialog is dismissed', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'dismiss');

      await expect(deleteButton(page, programName)).toBeVisible();
    });

    test('TC-006: deleting an already-deleted program refreshes the list', async ({
      browser,
    }) => {
      const programName = uniqueName('Test Program');
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await login(pageA);
      await login(pageB);
      await openPrograms(pageA);
      await createProgram(pageA, programName);
      await openPrograms(pageB);

      await triggerDelete(pageB, programName, 'accept');
      await expectProgramAbsent(pageB, programName);

      await triggerDelete(pageA, programName, 'accept');
      await openPrograms(pageA);
      await expectProgramAbsent(pageA, programName);

      await contextA.close();
      await contextB.close();
    });

    test('TC-007: confirming deletion once removes the program without duplicate delete errors', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      let deleteResponses = 0;
      page.on('response', (response) => {
        if (
          response.url().includes('/api/programs/') &&
          response.request().method() === 'DELETE'
        ) {
          deleteResponses += 1;
        }
      });

      await triggerDelete(page, programName, 'accept');

      await expectProgramAbsent(page, programName);
      expect(deleteResponses).toBeLessThanOrEqual(1);
    });

    test('TC-008: program with special characters in name can be deleted', async ({ page }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'accept');

      await expectProgramAbsent(page, programName);
    });

    test('TC-009: deleted program no longer appears in the program list', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'accept');

      await expectProgramAbsent(page, programName);
    });

    test('TC-010: deleting a program with a very long name shows the name in confirmation', async ({
      page,
    }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createProgram(page, programName);

      const message = await triggerDelete(page, programName, 'dismiss');

      expect(message).toContain(programName);
      await expect(deleteButton(page, programName)).toBeVisible();
    });

    test('TC-011: dismissing the confirmation dialog keeps the program', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'dismiss');

      await expect(programRow(page, programName)).toBeVisible();
    });

    test('TC-012: concurrent deletion by two users leaves the program removed', async ({
      browser,
    }) => {
      const programName = uniqueName('Test Program');
      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await login(pageA);
      await login(pageB);
      await openPrograms(pageA);
      await createProgram(pageA, programName);
      await openPrograms(pageB);

      const confirmDelete = async (target: Page) => {
        const button = deleteButton(target, programName);
        await button.scrollIntoViewIfNeeded();
        const accepted = new Promise<void>((resolve) => {
          target.once('dialog', async (dialog) => {
            await dialog.accept();
            resolve();
          });
        });
        await button.click();
        await accepted;
      };

      await Promise.all([confirmDelete(pageA), confirmDelete(pageB)]);

      await openPrograms(pageA);
      await openPrograms(pageB);
      await expectProgramAbsent(pageA, programName);
      await expectProgramAbsent(pageB, programName);

      await contextA.close();
      await contextB.close();
    });

    test('TC-013: rapid double-click on delete can open multiple confirmation dialogs', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      const messages: string[] = [];
      page.on('dialog', async (dialog) => {
        messages.push(dialog.message());
        await dialog.dismiss();
      });

      const button = deleteButton(page, programName);
      await button.scrollIntoViewIfNeeded();
      await button.dblclick();
      await page.waitForTimeout(500);

      expect(messages.length).toBeGreaterThanOrEqual(1);
      if (messages.length >= 2) {
        expect(messages[0]).toContain(programName);
        expect(messages[1]).toContain(programName);
      }

      await expect(deleteButton(page, programName)).toBeVisible();
    });
  });

  test('TC-005: unauthenticated user cannot delete a program', async ({ page }) => {
    await page.goto('/programs');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete / })).toHaveCount(0);
  });
});
