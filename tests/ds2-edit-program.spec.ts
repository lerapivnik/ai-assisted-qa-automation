import {
  expect,
  test,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { newAuthenticatedContext, openPrograms } from './helpers/auth';
import { createTrackedProgram, nameOfLength, uniqueName } from './helpers/programs';

const ASSUMED_PROGRAM_NAME_LENGTH = 255;

async function openEditForm(programsPage: ProgramsPage, programName: string): Promise<void> {
  await programsPage.openEditForm(programName);
  await expect(programsPage.editProgramModal.dialog).toBeVisible();
}

async function expectProgramSaved(
  programsPage: ProgramsPage,
  programName: string,
): Promise<void> {
  await expect(programsPage.editProgramModal.dialog).toBeHidden({ timeout: 45_000 });
  await expect(programsPage.programEditButton(programName).first()).toBeVisible({
    timeout: 60_000,
  });
}

test.describe('Edit existing program details', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await openPrograms(page);
    });

    test('TC-001: edit form displays pre-populated program data', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');
      await createTrackedProgram(programsPage, trackProgram, programName, description);

      await openEditForm(programsPage, programName);

      await expect(modal.programName).toHaveValue(programName);
      await expect(modal.description).toHaveValue(description);
      await expect(modal.showAiConfigButton).toBeVisible();
      await expect(modal.totalProgramHours).toBeVisible();
      await expect(modal.defaultSessionHours).toHaveValue('4');
      await expect(modal.defaultExamHours).toHaveValue('3');
      await expect(modal.targetAudience).toBeVisible();
      await expect(modal.focusAreas).toBeVisible();
      await expect(modal.syncAsyncRatio).toBeVisible();
      await expect(modal.cancelButton).toBeVisible();
      await expect(modal.saveButton).toBeVisible();
    });

    test('TC-002: program name update is reflected immediately in the list', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const updatedName = uniqueName('Web Development 2026 - Updated');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(updatedName);
      await modal.save();

      await expectProgramSaved(programsPage, updatedName);
      await expect(programsPage.programEditButton(programName)).toHaveCount(0);
      await expect(programsPage.alerts).toHaveCount(0);
    });

    test('TC-003: unchanged fields are preserved when only Description is edited', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');
      const updatedDescription = uniqueName('Updated full-stack curriculum for 2026');
      await createTrackedProgram(programsPage, trackProgram, programName, description);

      await openEditForm(programsPage, programName);
      await modal.description.fill(updatedDescription);
      await modal.save();
      await expectProgramSaved(programsPage, programName);

      await openEditForm(programsPage, programName);
      await expect(modal.programName).toHaveValue(programName);
      await expect(modal.description).toHaveValue(updatedDescription);
    });

    test('TC-004: description can be cleared while Name remains unchanged', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const description = uniqueName('Full-stack web development program');
      await createTrackedProgram(programsPage, trackProgram, programName, description);

      await openEditForm(programsPage, programName);
      await modal.description.fill('');
      await modal.save();
      await expectProgramSaved(programsPage, programName);

      await openEditForm(programsPage, programName);
      await expect(modal.programName).toHaveValue(programName);
      await expect(modal.description).toHaveValue('');
    });

    test('TC-005: Save is disabled when Program Name is cleared', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill('');

      await expect(modal.saveButton).toBeDisabled();
    });

    test('TC-006: Cancel discards unsaved edits and restores saved values on reopen', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const unsavedName = uniqueName('Should Not Be Saved');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(unsavedName);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programNameInList(programName)).toBeVisible();
      await expect(programsPage.programEditButton(unsavedName)).toHaveCount(0);

      await openEditForm(programsPage, programName);
      await expect(modal.programName).toHaveValue(programName);
    });

    // Product bug DS-252
    test.fixme('TC-007: duplicate program name is accepted on edit', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const existingName = uniqueName('Web Development 2026');
      const otherName = uniqueName('Data Science 2026');
      await createTrackedProgram(programsPage, trackProgram, existingName);
      await createTrackedProgram(programsPage, trackProgram, otherName);

      await openEditForm(programsPage, otherName);
      await modal.programName.fill(existingName);
      await modal.save();

      await expectProgramSaved(programsPage, existingName);
      await expect(programsPage.programEditButton(otherName)).toHaveCount(0);
      await expect(programsPage.programRow(existingName)).toHaveCount(2);
    });

    test('TC-009: program name with special characters is accepted on edit', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const updatedName = uniqueName('Web Dev & Design — Niveau 2');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(updatedName);
      await modal.save();

      await expectProgramSaved(programsPage, updatedName);
    });

    test('TC-010: program name at 255 characters is accepted on edit', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const updatedName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(updatedName);
      await modal.save();

      await expectProgramSaved(programsPage, updatedName);
    });

    test('TC-011: program name with only whitespace keeps Save disabled', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill('   ');

      await expect(modal.saveButton).toBeDisabled();
    });

    test('TC-013: leading and trailing whitespace in Program Name is trimmed on save', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const paddedName = `  ${programName}  `;
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(paddedName);
      await modal.save();

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
      await expect(programsPage.programEditButton(programName)).toBeVisible();
    });

    test('TC-014: optional AI fields accept input and save without blocking edit', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      await createTrackedProgram(programsPage, trackProgram, programName, 'Base description');

      await openEditForm(programsPage, programName);
      await modal.targetAudience.fill('Career changers, no CS background');
      await modal.focusAreas.fill('Python, SQL');
      await expect(modal.saveButton).toBeEnabled();
      await modal.save();

      await expectProgramSaved(programsPage, programName);
    });

    test('TC-015: closing the dialog with X discards unsaved edits like Cancel', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const unsavedName = uniqueName('Closed Via X');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(unsavedName);
      await modal.close();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programNameInList(programName)).toBeVisible();
      await expect(programsPage.programEditButton(unsavedName)).toHaveCount(0);

      await openEditForm(programsPage, programName);
      await expect(modal.programName).toHaveValue(programName);
    });

    test('TC-016: program name longer than 255 characters is accepted on edit', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const programName = uniqueName('Web Development 2026');
      const updatedName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH + 1);
      await createTrackedProgram(programsPage, trackProgram, programName);

      await openEditForm(programsPage, programName);
      await modal.programName.fill(updatedName);
      await modal.save();

      await expectProgramSaved(programsPage, updatedName);
      await expect(modal.alerts).toHaveCount(0);
    });

    // Product bug — CI run 39497968982
    test.fixme('TC-012: concurrent edit by two users shows appropriate conflict handling', async ({
      browser,
      trackProgram,
    }) => {
      const programName = uniqueName('Web Development 2026');
      const descriptionA = uniqueName('Updated by User A');
      const descriptionB = uniqueName('Updated by User B');

      const setup = await newAuthenticatedContext(browser);
      const setupPage = await setup.newPage();
      const setupPrograms = await openPrograms(setupPage);
      await createTrackedProgram(
        setupPrograms,
        trackProgram,
        programName,
        uniqueName('Original description'),
      );
      await setup.close();

      const contextA = await newAuthenticatedContext(browser);
      const contextB = await newAuthenticatedContext(browser);
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();
      const programsA = await openPrograms(pageA);
      const programsB = await openPrograms(pageB);
      const modalA = programsA.editProgramModal;
      const modalB = programsB.editProgramModal;

      await openEditForm(programsA, programName);
      await openEditForm(programsB, programName);

      await modalA.description.fill(descriptionA);
      await modalA.save();
      await expectProgramSaved(programsA, programName);

      await modalB.description.fill(descriptionB);
      const secondSave = pageB.waitForResponse(
        (response) =>
          response.url().includes('/api/programs/') &&
          response.request().method() === 'PATCH',
      );
      await modalB.save();
      const response = await secondSave;

      if (response.status() >= 400) {
        await expect(programsB.failureMessage).toBeVisible();
        await expect(modalB.dialog).toBeVisible();
      } else {
        await expectProgramSaved(programsB, programName);
      }

      await openEditForm(programsA, programName);
      const finalDescription = await modalA.description.inputValue();
      expect([descriptionA, descriptionB]).toContain(finalDescription);

      await contextA.close();
      await contextB.close();
    });
  });
});
