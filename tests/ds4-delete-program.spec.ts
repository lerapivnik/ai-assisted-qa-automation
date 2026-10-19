import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { newAuthenticatedContext, openPrograms } from './helpers/auth';
import { createTrackedProgram, nameOfLength, uniqueName } from './helpers/programs';

const ASSUMED_PROGRAM_NAME_LENGTH = 255;
const DELETE_CONFIRM_SNIPPET = 'All its semesters and courses will be removed';

async function triggerDelete(
  programsPage: ProgramsPage,
  programName: string,
  action: 'accept' | 'dismiss',
): Promise<{ type: string; message: string }> {
  const handled = new Promise<{ type: string; message: string }>((resolve) => {
    programsPage.page.once('dialog', async (dialog) => {
      const result = { type: dialog.type(), message: dialog.message() };
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
      resolve(result);
    });
  });

  await programsPage.clickDelete(programName);
  return handled;
}

async function expectProgramAbsent(
  programsPage: ProgramsPage,
  programName: string,
): Promise<void> {
  await expect(programsPage.programDeleteButton(programName)).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(programsPage.programRow(programName)).toHaveCount(0);
}

test.describe('Delete program with confirmation', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await openPrograms(page);
    });

    test('TC-001: program is permanently removed after confirming deletion', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await triggerDelete(programsPage, programName, 'accept');

      await expectProgramAbsent(programsPage, programName);
    });

    test('TC-002: program remains in the list when deletion is cancelled', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await triggerDelete(programsPage, programName, 'dismiss');

      await expect(programsPage.programDeleteButton(programName)).toBeVisible();
      await expect(programsPage.programRow(programName)).toBeVisible();
    });

    test('TC-003: confirmation dialog displays the program name and cascade warning', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      const { type, message } = await triggerDelete(programsPage, programName, 'dismiss');

      expect(type).toBe('confirm');
      expect(message).toContain(programName);
      expect(message).toContain(DELETE_CONFIRM_SNIPPET);
      expect(message.toLowerCase()).toContain('cannot be undone');
      await expect(programsPage.programDeleteButton(programName)).toBeVisible();
    });

    test('TC-004: program is not deleted when confirmation dialog is dismissed', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await triggerDelete(programsPage, programName, 'dismiss');

      await expect(programsPage.programDeleteButton(programName)).toBeVisible();
    });

    test('TC-006: deleting an already-deleted program refreshes the list', async ({
      browser,
      trackProgram,
    }) => {
      const programName = uniqueName('Test Program');
      const contextA = await newAuthenticatedContext(browser);
      const contextB = await newAuthenticatedContext(browser);
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const programsA = await openPrograms(pageA);
      await createTrackedProgram(programsA, trackProgram, programName);
      const programsB = await openPrograms(pageB);

      await triggerDelete(programsB, programName, 'accept');
      await expectProgramAbsent(programsB, programName);

      await triggerDelete(programsA, programName, 'accept');
      await openPrograms(pageA);
      await expectProgramAbsent(programsA, programName);

      await contextA.close();
      await contextB.close();
    });

    test('TC-007: confirming deletion once removes the program without duplicate delete errors', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      let deleteResponses = 0;
      page.on('response', (response) => {
        if (
          response.url().includes('/api/programs/') &&
          response.request().method() === 'DELETE'
        ) {
          deleteResponses += 1;
        }
      });

      await triggerDelete(programsPage, programName, 'accept');

      await expectProgramAbsent(programsPage, programName);
      expect(deleteResponses).toBeLessThanOrEqual(1);
    });

    test('TC-008: program with special characters in name can be deleted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Informatique & IA - Niveau 2');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await triggerDelete(programsPage, programName, 'accept');

      await expectProgramAbsent(programsPage, programName);
    });

    test('TC-009: deleted program no longer appears in the program list', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await triggerDelete(programsPage, programName, 'accept');

      await expectProgramAbsent(programsPage, programName);
    });

    test('TC-010: deleting a program with a very long name shows the name in confirmation', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createTrackedProgram(programsPage, trackProgram, programName);

      const { message } = await triggerDelete(programsPage, programName, 'dismiss');

      expect(message).toContain(programName);
      await expect(programsPage.programDeleteButton(programName)).toBeVisible();
    });

    test('TC-011: dismissing the confirmation dialog keeps the program', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await triggerDelete(programsPage, programName, 'dismiss');

      await expect(programsPage.programRow(programName)).toBeVisible();
    });

    test('TC-012: concurrent deletion by two users leaves the program removed', async ({
      browser,
      trackProgram,
    }) => {
      const programName = uniqueName('Test Program');
      const contextA = await newAuthenticatedContext(browser);
      const contextB = await newAuthenticatedContext(browser);
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const programsA = await openPrograms(pageA);
      await createTrackedProgram(programsA, trackProgram, programName);
      const programsB = await openPrograms(pageB);

      const confirmDelete = async (target: ProgramsPage) => {
        const accepted = new Promise<void>((resolve) => {
          target.page.once('dialog', async (dialog) => {
            await dialog.accept();
            resolve();
          });
        });
        await target.clickDelete(programName);
        await accepted;
      };

      await Promise.all([confirmDelete(programsA), confirmDelete(programsB)]);

      await openPrograms(pageA);
      await openPrograms(pageB);
      await expectProgramAbsent(programsA, programName);
      await expectProgramAbsent(programsB, programName);

      await contextA.close();
      await contextB.close();
    });

    test('TC-013: rapid double-click on delete can open multiple confirmation dialogs', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      const messages: string[] = [];
      page.on('dialog', async (dialog) => {
        messages.push(dialog.message());
        await dialog.dismiss();
      });

      await programsPage.dblclickDelete(programName);
      await expect.poll(() => messages.length, { timeout: 5_000 }).toBeGreaterThanOrEqual(1);

      expect(messages[0]).toContain(programName);
      if (messages.length >= 2) {
        expect(messages[1]).toContain(programName);
      }

      await expect(programsPage.programDeleteButton(programName)).toBeVisible();
    });
  });
});
