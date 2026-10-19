import {
  expect,
  extractProgramId,
  isProgramCreateResponse,
  test,
  type Page,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { openPrograms } from './helpers/auth';
import { clickCreateAndTrack, nameOfLength, uniqueName } from './helpers/programs';

/** DS-1 ACs do not define a max length. The live form has no HTML maxLength. */
const ASSUMED_PROGRAM_NAME_LENGTH = 255;

async function expectProgramCreated(
  programsPage: ProgramsPage,
  programName: string,
): Promise<void> {
  await expect(programsPage.newProgramModal.dialog).toBeHidden({ timeout: 45_000 });
  await expect(programsPage.programNameInList(programName)).toBeVisible();
}

async function openCreateForm(programsPage: ProgramsPage): Promise<void> {
  const modal = programsPage.newProgramModal;
  await programsPage.openNewProgramForm();
  await expect(modal.dialog).toBeVisible();
  await expect(modal.programName).toBeVisible();
  await expect(modal.description).toBeVisible();
}

async function dblClickCreateAndTrack(
  programsPage: ProgramsPage,
  trackProgram: (uuid: string) => void,
): Promise<void> {
  const seenIds = new Set<string>();
  const { page } = programsPage;
  const onCreateResponse = async (
    response: Awaited<ReturnType<Page['waitForResponse']>>,
  ) => {
    if (!isProgramCreateResponse(response) || !response.ok()) {
      return;
    }
    const id = extractProgramId(await response.json());
    if (seenIds.has(id)) {
      return;
    }
    seenIds.add(id);
    trackProgram(id);
  };

  page.on('response', onCreateResponse);
  await programsPage.newProgramModal.dblclickCreate();
  await expect(programsPage.newProgramModal.dialog).toBeHidden({ timeout: 45_000 });
  await expect
    .poll(() => seenIds.size, { timeout: 10_000 })
    .toBeGreaterThanOrEqual(2);
  page.off('response', onCreateResponse);
}

test.describe('Create new academic program', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await openPrograms(page);
    });

    test('TC-001: program creation form displays required fields when opened from Programs page', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      await openCreateForm(programsPage);

      await expect(modal.programName).toBeEditable();
      await expect(modal.programName).toHaveAttribute(
        'placeholder',
        'e.g. Computer Science BSc',
      );
      await expect(modal.description).toBeEditable();
      await expect(modal.description).toHaveAttribute('placeholder', 'Brief description');
      await expect(modal.showAiConfigButton).toBeVisible();
      await expect(modal.totalProgramHours).toBeVisible();
      await expect(modal.defaultSessionHours).toHaveValue('4');
      await expect(modal.defaultExamHours).toHaveValue('3');
      await expect(modal.targetAudience).toBeVisible();
      await expect(modal.focusAreas).toBeVisible();
      await expect(modal.syncAsyncRatio).toBeVisible();
      await expect(modal.cancelButton).toBeVisible();
      await expect(modal.createButton).toBeVisible();
      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-002: new program is created and appears in the program list', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Web Development 2026');
      const description = 'Full-stack web development program';

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expectProgramCreated(programsPage, programName);
      await expect(
        programsPage.programDescriptionInList(programName, description),
      ).toBeVisible();
      await expect(programsPage.alerts).toHaveCount(0);
    });

    test('TC-003: program is created with only Program Name filled', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Data Science 2026');

      await openCreateForm(programsPage);
      await modal.fill(programName);
      await expect(modal.description).toHaveValue('');
      await clickCreateAndTrack(programsPage, trackProgram);

      await expectProgramCreated(programsPage, programName);
    });

    test('TC-004: Create button remains disabled when Program Name is empty', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      await openCreateForm(programsPage);
      await expect(modal.programName).toHaveValue('');

      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-005: program is not created when form is submitted without a name', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const description = uniqueName('Some description');

      await openCreateForm(programsPage);
      await expect(modal.programName).toHaveValue('');
      await modal.description.fill(description);

      await expect(modal.createButton).toBeDisabled();
      await expect(programsPage.programEditButton(description)).toHaveCount(0);
    });

    test('TC-007: program name at 255 characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      const description = uniqueName('Boundary test program');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await expect(modal.programName).toHaveValue(programName);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expectProgramCreated(programsPage, programName);
    });

    test('TC-008: program name longer than 255 characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH + 1);
      const description = uniqueName('Over limit test');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await expect(modal.programName).toHaveValue(programName);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expectProgramCreated(programsPage, programName);
      await expect(modal.alerts).toHaveCount(0);
    });

    test('TC-009: program name with special characters is accepted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Informatique & IA - Niveau 2');
      const description = uniqueName('French-language program with accents: été');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expectProgramCreated(programsPage, programName);
    });

    test('TC-010: program name with only whitespace is treated as empty', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      await openCreateForm(programsPage);
      await modal.programName.fill('   ');

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('TC-011: closing the modal with Cancel does not add the program and keeps typed values', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Unsaved Program');
      const description = uniqueName('This should not be saved');

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programEditButton(programName)).toHaveCount(0);

      await openCreateForm(programsPage);
      await expect(modal.programName).toHaveValue(programName);
      await expect(modal.description).toHaveValue(description);
    });

    test('TC-012: program is created when optional AI generation fields are filled', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('AI Config Program');
      const description = 'Full-stack web development program';

      await openCreateForm(programsPage);
      await modal.fill(programName, description);
      await modal.totalProgramHours.fill('900');
      await modal.targetAudience.fill('Career changers, no CS background');
      await modal.focusAreas.fill('Python, SQL, Machine Learning');
      await clickCreateAndTrack(programsPage, trackProgram);

      await expectProgramCreated(programsPage, programName);
      await expect(
        programsPage.programDescriptionInList(
          programName,
          'Full-stack web development program900Career changers, no CS backgroundPython, SQL, Machine Learning',
        ),
      ).toBeVisible();
    });

    test('TC-013: leading and trailing whitespace in Program Name is trimmed before save', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Web Development 2026');
      const paddedName = `  ${programName}  `;

      await openCreateForm(programsPage);
      await modal.programName.fill(paddedName);
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(programsPage.programNameInList(programName)).toBeVisible();
      await expect(programsPage.programNameInList(programName)).toHaveText(programName);
    });

    test('TC-015: duplicate program name is accepted on create', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Web Development 2026');

      await openCreateForm(programsPage);
      await modal.fill(programName, 'Original program');
      await clickCreateAndTrack(programsPage, trackProgram);
      await expectProgramCreated(programsPage, programName);

      await openCreateForm(programsPage);
      await modal.fill(programName, 'Duplicate attempt');
      await clickCreateAndTrack(programsPage, trackProgram);

      await expect(modal.dialog).toBeHidden({ timeout: 45_000 });
      await expect(modal.alerts).toHaveCount(0);
      await expect(programsPage.programRow(programName)).toHaveCount(2);
    });

    test('TC-016: rapid double-click on Create produces two program records', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Double Click Program');

      await openCreateForm(programsPage);
      await modal.fill(programName);
      await dblClickCreateAndTrack(programsPage, trackProgram);

      await expect(programsPage.programRow(programName)).toHaveCount(2);
    });

    test('TC-017: program creation form is empty after a successful create', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Reset After Create');

      await openCreateForm(programsPage);
      await modal.fill(programName, 'Should not persist after save');
      await clickCreateAndTrack(programsPage, trackProgram);
      await expectProgramCreated(programsPage, programName);

      await openCreateForm(programsPage);
      await expect(modal.programName).toHaveValue('');
      await expect(modal.description).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
    });

    test('TC-018: non-numeric Total Program Hours is stripped and does not block create', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Hours Probe');

      await openCreateForm(programsPage);
      await modal.programName.fill(programName);
      await modal.totalProgramHours.fill('abc');
      await expect(modal.totalProgramHours).toHaveValue('');
      await expect(modal.createButton).toBeEnabled();

      await modal.totalProgramHours.fill('-5');
      await expect(modal.totalProgramHours).toHaveValue('');
      await expect(modal.createButton).toBeEnabled();
      await expect(modal.alerts).toHaveCount(0);

      await clickCreateAndTrack(programsPage, trackProgram);
      await expectProgramCreated(programsPage, programName);
    });

    test('TC-019: closing the dialog with X does not add the program and keeps typed values', async ({
      page,
    }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = uniqueName('Closed via X');

      await openCreateForm(programsPage);
      await modal.programName.fill(programName);
      await modal.close();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programEditButton(programName)).toHaveCount(0);

      await openCreateForm(programsPage);
      await expect(modal.programName).toHaveValue(programName);
    });
  });
});
