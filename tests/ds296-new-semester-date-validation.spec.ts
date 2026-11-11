import { expect, test, type Page } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { openPrograms } from './helpers/auth';
import { createTrackedProgram, uniqueName } from './helpers/programs';

/** Valid range: end is not before start (live UI enables Create Semester). */
const START_DATE = '2026-09-01';
const END_DATE = '2026-12-15';
/** Same-day range is treated as valid (Create Semester enables). */
const SAME_DAY = '2026-10-01';
/** End before start — create must not succeed. */
const END_BEFORE_START = '2026-08-01';

async function openNewSemesterDialog(
  page: Page,
  trackProgram: (uuid: string) => void,
): Promise<{ programsPage: ProgramsPage }> {
  const programsPage = await openPrograms(page);
  const programName = uniqueName('DS-296 Program');
  await createTrackedProgram(
    programsPage,
    trackProgram,
    programName,
    uniqueName('DS-296 semester date validation'),
  );
  await programsPage.selectProgramRow(programName);
  await programsPage.openNewSemesterForm();
  await expect(programsPage.newSemesterModal.dialog).toBeVisible();
  return { programsPage };
}

test.describe('Verify New Semester date validation', () => {
  test.describe.configure({ timeout: 120_000 });

  test.describe('authenticated admin', () => {
    test('Create Semester enables for a valid date range once name is filled', { tag: '@sanity' }, async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await modal.fill(uniqueName('Semester 1'), START_DATE, END_DATE);

      await expect(modal.createButton).toBeEnabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('Create Semester is disabled when Start Date is empty', { tag: '@sanity' }, async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await modal.fillName(uniqueName('Semester 1'));
      await modal.fillEndDate(END_DATE);

      await expect(modal.startDate).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    });

    test('Create Semester is disabled when End Date is empty', { tag: '@sanity' }, async ({
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

    test('End Date before Start Date does not create a semester', { tag: '@regression' }, async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;
      const semesterName = uniqueName('Invalid range semester');

      await modal.fill(semesterName, START_DATE, END_BEFORE_START);

      // Rejected submit: dialog stays open and no semester create succeeds.
      // Live crawl may clear date fields; do not assert retained values or invent error copy.
      const createResponsePromise = page
        .waitForResponse(
          (response) =>
            /\/api\/.*semester/i.test(response.url()) &&
            response.request().method() === 'POST',
          { timeout: 5_000 },
        )
        .catch(() => null);

      await modal.clickCreate();

      await expect(modal.dialog).toBeVisible();
      const createResponse = await createResponsePromise;
      expect(createResponse === null || createResponse.ok() === false).toBeTruthy();
    });

    test('Same Start Date and End Date enables Create Semester with a name', { tag: '@regression' }, async ({
      page,
      trackProgram,
    }) => {
      const { programsPage } = await openNewSemesterDialog(page, trackProgram);
      const modal = programsPage.newSemesterModal;

      await modal.fill(uniqueName('Semester 1'), SAME_DAY, SAME_DAY);

      await expect(modal.createButton).toBeEnabled();
      await expect(modal.dialog).toBeVisible();
    });
  });
});
