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

function deleteButton(page: Page, programName: string): Locator {
  return page.getByRole('button', { name: `Delete ${programName}` });
}

function programInList(page: Page, programName: string): Locator {
  return page.getByRole('table').getByText(programName, { exact: true });
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
  await expect(newProgramDialog(page)).toBeHidden({ timeout: 30_000 });
  await expect(programInList(page, programName)).toBeVisible();
}

async function triggerDelete(
  page: Page,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<string> {
  let message = '';
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    message = dialog.message();
    if (action === 'accept') {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
  await deleteButton(page, programName).click();
  await page.waitForTimeout(500);
  return message;
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

      await expect(programInList(page, programName)).toHaveCount(0);
    });

    test('TC-002: program remains in the list when deletion is cancelled', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'dismiss');

      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-003: confirmation dialog displays the program name being deleted', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      const message = await triggerDelete(page, programName, 'dismiss');

      expect(message).toContain(programName);
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-004: program is not deleted when confirmation dialog is dismissed', async ({
      page,
    }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      page.once('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      await deleteButton(page, programName).click();
      await page.keyboard.press('Escape');

      await expect(programInList(page, programName)).toBeVisible();
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
      await expect(programInList(pageB, programName)).toHaveCount(0);

      pageA.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await deleteButton(pageA, programName).click();
      await openPrograms(pageA);

      await expect(programInList(pageA, programName)).toHaveCount(0);

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

      page.once('dialog', async (dialog) => {
        await dialog.accept();
        await dialog.accept().catch(() => undefined);
      });
      await deleteButton(page, programName).click();

      await expect(programInList(page, programName)).toHaveCount(0);
      expect(deleteResponses).toBeLessThanOrEqual(1);
    });

    test('TC-008: program with special characters in name can be deleted', async ({ page }) => {
      const programName = uniqueName('Informatique & IA - Niveau 2');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'accept');

      await expect(programInList(page, programName)).toHaveCount(0);
    });

    test('TC-009: deleted program no longer appears in the program list', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      await triggerDelete(page, programName, 'accept');

      await expect(programInList(page, programName)).toHaveCount(0);
    });

    test('TC-010: deleting a program with a very long name shows the name in confirmation', async ({
      page,
    }) => {
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createProgram(page, programName);

      const message = await triggerDelete(page, programName, 'dismiss');

      expect(message).toContain(programName);
      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-011: dismissing the confirmation dialog keeps the program', async ({ page }) => {
      const programName = uniqueName('Test Program');
      await createProgram(page, programName);

      page.once('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      await deleteButton(page, programName).click();

      await expect(programInList(page, programName)).toBeVisible();
    });

    test('TC-012: concurrent deletion by two users is handled gracefully', async ({
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

      const acceptDelete = (page: Page) => {
        page.once('dialog', async (dialog) => {
          await dialog.accept();
        });
      };

      acceptDelete(pageA);
      acceptDelete(pageB);
      await deleteButton(pageA, programName).click();
      await deleteButton(pageB, programName).click();

      await openPrograms(pageA);
      await openPrograms(pageB);
      await expect(programInList(pageA, programName)).toHaveCount(0);
      await expect(programInList(pageB, programName)).toHaveCount(0);

      await contextA.close();
      await contextB.close();
    });
  });

  test('TC-005: unauthenticated user cannot delete a program', async ({ page }) => {
    await page.goto('/programs');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete / })).toHaveCount(0);
  });
});
