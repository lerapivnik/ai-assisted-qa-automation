import { expect, test, type Page } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { openPrograms } from './helpers/auth';
import { createTrackedProgram, uniqueName } from './helpers/programs';

/** Valid range: end is not before start (live UI enables Create Semester). */
const START_DATE = '2026-09-01';
const END_DATE = '2026-12-15';

async function openNewSemesterDialog(
  page: Page,
  trackProgram: (uuid: string) => void,
): Promise<{ programsPage: ProgramsPage }> {
  const programsPage = await openPrograms(page);
  const programName = uniqueName('DS-295 Program');
  await createTrackedProgram(
    programsPage,
    trackProgram,
    programName,
    uniqueName('DS-295 semester required fields'),
  );
  await programsPage.selectProgramRow(programName);
  await programsPage.openNewSemesterForm();
  await expect(programsPage.newSemesterModal.dialog).toBeVisible();
  return { programsPage };
}

test.describe('Validate New Semester required fields', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test('Create Semester enables when name and both dates are filled', async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await modal.fill(uniqueName('Semester 1'), START_DATE, END_DATE);

      await expect(modal.createButton).toBeEnabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('Create Semester is disabled when name and dates are empty', async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await expect(modal.semesterName).toHaveValue('');
      await expect(modal.startDate).toHaveValue('');
      await expect(modal.endDate).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('Create Semester stays disabled when only Semester Name is entered', async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await modal.fillName(uniqueName('Semester 1'));

      await expect(modal.startDate).toHaveValue('');
      await expect(modal.endDate).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('Create Semester stays disabled when End Date is still empty', async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await modal.fillName(uniqueName('Semester 1'));
      await modal.fillStartDate(START_DATE);

      await expect(modal.endDate).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });
  });
});
