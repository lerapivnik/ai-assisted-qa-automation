import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { openPrograms } from './helpers/auth';
import {
  clickCreateAndTrack,
  createTrackedProgram,
  nameOfLength,
  uniqueName,
} from './helpers/programs';

/** Jira does not define a max length. The live form has no HTML maxLength. */
const ASSUMED_PROGRAM_NAME_LENGTH = 255;

async function openCreateForm(programsPage: ProgramsPage): Promise<void> {
  await programsPage.openNewProgramForm();
  await expect(programsPage.newProgramModal.dialog).toBeVisible();
}

test.describe('Program name validation and duplicate prevention', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await openPrograms(page);
    });

    test('TC-001: program name with special characters is accepted and saved', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = uniqueName('Advanced informatics and AI program');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
    });

    test('TC-002: program name with accented characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName("Programme d'Été 2026");
      const description = uniqueName('Summer program in French');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
    });

    test('TC-003: whitespace-only program name is rejected and form is not submitted', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      await openCreateForm(programsPage);
      await modal.programName.fill('   ');
      await modal.description.fill(uniqueName('Valid description'));

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('TC-004: duplicate program name is accepted on create', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Web Development 2026');
      await createTrackedProgram(programsPage, trackProgram, programName, uniqueName('Original program'));

      await openCreateForm(programsPage);
      await modal.fill(programName, uniqueName('Duplicate attempt'));
      await expect(modal.alerts).toHaveCount(0);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programRow(programName)).toHaveCount(2);
    });

    test('TC-005: empty program name prevents form submission', async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      await openCreateForm(programsPage);
      await expect(modal.programName).toHaveValue('');
      await modal.description.fill(uniqueName('Description without name'));

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('TC-006: duplicate check is case-sensitive on create', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Web Development 2026');
      const caseVariant = programName.toLowerCase();
      await createTrackedProgram(programsPage, trackProgram, programName, uniqueName('Original'));

      await openCreateForm(programsPage);
      await modal.fill(caseVariant, uniqueName('Case variation test'));
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programRow(programName)).toHaveCount(1);
      await expect(programsPage.programRow(caseVariant)).toHaveCount(1);
    });

    test('TC-007: leading and trailing whitespace is trimmed before save', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Web Development 2026');
      const paddedName = `  ${programName}  `;
      await createTrackedProgram(programsPage, trackProgram, programName, uniqueName('Original'));

      await openCreateForm(programsPage);
      await modal.fill(paddedName, uniqueName('Whitespace padding test'));
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programRow(programName)).toHaveCount(2);
    });

    test('TC-008: program name at 255 characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      const description = uniqueName('Max length boundary test');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
    });

    test('TC-009: program name longer than 255 characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH + 1);
      const description = uniqueName('Over limit test');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
      await expect(modal.alerts).toHaveCount(0);
    });

    test('TC-010: program name with HTML/script tags is stored as plain text', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      let dialogOpened = false;
      page.on('dialog', async (dialog) => {
        dialogOpened = true;
        await dialog.dismiss();
      });

      const programName = uniqueName("<script>alert('xss')</script>");
      const description = uniqueName('XSS test description');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      expect(dialogOpened).toBe(false);
      await expect(programsPage.programNameInList(programName)).toBeVisible();
    });

    test('TC-011: program name with only special characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('---');
      const description = uniqueName('Special chars only name');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
    });

    test('TC-012: duplicate prevention does not block edit rename to existing name', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const existingName = uniqueName('Web Development 2026');
      const otherName = uniqueName('Data Science 2026');
      await createTrackedProgram(programsPage, trackProgram, existingName);
      await createTrackedProgram(programsPage, trackProgram, otherName);

      await programsPage.openEditForm(otherName);
      await modal.programName.fill(existingName);
      await modal.save();

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programEditButton(otherName)).toHaveCount(0);
      await expect(programsPage.programRow(existingName)).toHaveCount(2);
    });

    test('TC-013: rapid double-click on Create produces duplicate program records', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Double Click Program');

      const seenIds = new Set<string>();
      page.on('response', async (response) => {
        if (
          response.request().method() !== 'POST' ||
          !response.url().includes('/api/programs') ||
          !response.ok()
        ) {
          return;
        }
        try {
          const body = await response.json();
          const id = body?.id ?? body?.uuid ?? body?.programId ?? body?.data?.id;
          if (typeof id === 'string' && id.length > 0 && !seenIds.has(id)) {
            seenIds.add(id);
            trackProgram(id);
          }
        } catch {
          return;
        }
      });

      await openCreateForm(programsPage);
      await modal.fill(programName);
      await modal.dblclickCreate();

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programRow(programName)).toHaveCount(2);
    });

    test('TC-014: tab and newline characters in Program Name are normalized on save', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const suffix = String(Date.now());
      const rawName = `DS3\tTab\n${suffix}`;
      const savedName = `DS3\tTab ${suffix}`;

      await openCreateForm(programsPage);
      await modal.fill(rawName, uniqueName('Tab newline test'));
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programEditButton(savedName)).toBeVisible();
    });
  });
});
