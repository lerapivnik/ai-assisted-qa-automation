import type { Dialog } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import { openPrograms } from './helpers/auth';
import { createTrackedProgram, nameOfLength, uniqueName } from './helpers/programs';

const ASSUMED_PROGRAM_NAME_LENGTH = 255;

function expectedDeleteConfirm(name: string): string {
  return `Delete program "${name}"? All its semesters and courses will be removed. This cannot be undone.`;
}

async function openDeleteConfirm(
  programsPage: ProgramsPage,
  programName: string,
): Promise<{ dialog: Dialog; clickPromise: Promise<void> }> {
  // Native confirm blocks locator.click() until the dialog is handled.
  const dialogPromise = programsPage.page.waitForEvent('dialog');
  const clickPromise = programsPage.clickDelete(programName);
  const dialog = await dialogPromise;
  return { dialog, clickPromise };
}

async function confirmDelete(
  programsPage: ProgramsPage,
  programName: string,
): Promise<string> {
  const dialogPromise = programsPage.page.waitForEvent('dialog');
  const deleteResponse = programsPage.page.waitForResponse(
    (response) =>
      response.url().includes('/api/programs/') &&
      response.request().method() === 'DELETE',
  );
  const clickPromise = programsPage.clickDelete(programName);
  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog.accept();
  await clickPromise;
  await deleteResponse;
  return message;
}

async function expectProgramRemoved(
  programsPage: ProgramsPage,
  programName: string,
): Promise<void> {
  await expect(programsPage.programDeleteButton(programName)).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(programsPage.programRow(programName)).toHaveCount(0);
  await expect(programsPage.alerts).toHaveCount(0);
}

async function expectProgramStillListed(
  programsPage: ProgramsPage,
  programName: string,
): Promise<void> {
  await expect(programsPage.programDeleteButton(programName)).toBeVisible();
  await expect(programsPage.programRow(programName)).toBeVisible();
}

test.describe('Delete program with confirmation', () => {
  test.describe.configure({ timeout: 120_000 });

  // Rapid double-click can queue two native confirms (DS-30 / DS-109 / DS-156 / DS-218).
  // Not automated — not specified as intended AC behavior.

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await openPrograms(page);
    });

    test('TC-001: delete program with confirmation', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);
      await expectProgramRemoved(programsPage, programName);
    });

    test('TC-002: cancel program deletion', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      const { dialog, clickPromise } = await openDeleteConfirm(
        programsPage,
        programName,
      );
      expect(dialog.message()).toBe(expectedDeleteConfirm(programName));
      await dialog.dismiss();
      await clickPromise;

      await expectProgramStillListed(programsPage, programName);
    });

    test('TC-003: confirmation dialog names the program and warns cascade/undo', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      const { dialog, clickPromise } = await openDeleteConfirm(
        programsPage,
        programName,
      );
      const message = dialog.message();
      expect(message).toBe(expectedDeleteConfirm(programName));
      expect(message).toContain(programName);
      expect(message).toContain('All its semesters and courses will be removed');
      expect(message).toContain('This cannot be undone');
      await dialog.dismiss();
      await clickPromise;

      await expectProgramStillListed(programsPage, programName);
    });

    test('TC-004: dismissing confirmation leaves program in list', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      const { dialog, clickPromise } = await openDeleteConfirm(
        programsPage,
        programName,
      );
      await dialog.dismiss();
      await clickPromise;

      await expectProgramStillListed(programsPage, programName);
    });

    test('TC-006: confirmed deletion removes Delete action for that name', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);

      await expect(programsPage.programDeleteButton(programName)).toHaveCount(0, {
        timeout: 30_000,
      });
      await expect(programsPage.alerts).toHaveCount(0);
    });

    test('TC-007: program with special characters can be deleted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Informatique & IA - Niveau 2');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);
      await expectProgramRemoved(programsPage, programName);
    });

    test('TC-008: deleted program stays gone after reload', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);
      await expectProgramRemoved(programsPage, programName);

      await programsPage.reloadList();
      await expect(programsPage.heading).toBeVisible();
      await expectProgramRemoved(programsPage, programName);
    });

    test('TC-009: 255-character name appears in confirm message', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createTrackedProgram(programsPage, trackProgram, programName);

      const { dialog, clickPromise } = await openDeleteConfirm(
        programsPage,
        programName,
      );
      expect(dialog.message()).toBe(expectedDeleteConfirm(programName));
      expect(dialog.message()).toContain(programName);
      await dialog.dismiss();
      await clickPromise;

      await expectProgramStillListed(programsPage, programName);
    });
  });

  test('TC-005: unauthenticated user cannot delete a program', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    const programsPage = new ProgramsPage(page);
    const loginPage = new LoginPage(page);

    await programsPage.goto();

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(loginPage.signInHeading).toBeVisible({ timeout: 30_000 });
    await expect(loginPage.signInHeading).toHaveText('Sign in to your account');
    await expect(programsPage.deleteActions).toHaveCount(0);

    await context.close();
  });
});
