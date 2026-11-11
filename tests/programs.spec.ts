import {
  expect,
  isProgramCreateResponse,
  test,
  trackCreateFromResponse,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectProgramListed, uniqueName } from './helpers/programs';

test.describe('Programs', () => {
  test.describe.configure({ timeout: 120_000 });

  test('program creation form displays required fields when opened from Programs page', { tag: '@smoke' }, async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
    await expect(programsPage.newProgramButton).toBeVisible({ timeout: 30_000 });

    await programsPage.openNewProgramForm();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.programName).toBeVisible();
    await expect(modal.description).toBeVisible();
    await expect(modal.cancelButton).toBeVisible();
    await expect(modal.createButton).toBeVisible();
    await expect(modal.createButton).toBeDisabled();
  });

  test('new program is created and appears in the program list', { tag: '@smoke' }, async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';

    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

    await programsPage.openNewProgramForm();
    const createResponse = page.waitForResponse(isProgramCreateResponse);
    await programsPage.createProgram(programName, description);
    await trackCreateFromResponse(await createResponse, trackProgram);

    await expect(programsPage.newProgramModal.dialog).toBeHidden({ timeout: 45_000 });
    await programsPage.reloadList();
    await expectProgramListed(programsPage, programName);
    await expect(programsPage.programDescriptionInList(programName, description)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('program is created with only Program Name filled', { tag: '@sanity' }, async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueName('Data Science 2026');

    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

    await programsPage.openNewProgramForm();
    const createResponse = page.waitForResponse(isProgramCreateResponse);
    await programsPage.createProgram(programName);
    await trackCreateFromResponse(await createResponse, trackProgram);

    await expect(programsPage.newProgramModal.dialog).toBeHidden({ timeout: 45_000 });
    await programsPage.reloadList();
    await expect(programsPage.programEditButton(programName)).toBeVisible({ timeout: 30_000 });
  });
});
