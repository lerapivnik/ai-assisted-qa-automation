import AxeBuilder from '@axe-core/playwright';
import {
  expect,
  isProgramCreateResponse,
  test,
  trackCreateFromResponse,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectNoAxeViolations, runA11yCheckInCi } from './helpers/a11y';
import { createTrackedProgram, uniqueName } from './helpers/programs';

const axeTags = ['wcag2a', 'wcag2aa'] as const;

test.describe('Programs accessibility', () => {
  test.describe.configure({ timeout: 120_000 });

  test('Programs page has no axe violations', { tag: '@regression' }, async ({ page }, testInfo) => {
    await runA11yCheckInCi(testInfo, 'programs-page-axe', async () => {
      const programsPage = new ProgramsPage(page);

      await programsPage.goto();
      await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

      const results = await new AxeBuilder({ page }).withTags([...axeTags]).analyze();
      await expectNoAxeViolations(results.violations, testInfo);
    });
  });

  test(
    'keyboard focuses New Program and opens dialog with Enter',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      await runA11yCheckInCi(testInfo, 'keyboard-new-program', async () => {
        const programsPage = new ProgramsPage(page);
        const modal = programsPage.newProgramModal;

        await programsPage.goto();
        await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

        await programsPage.tabToNewProgramButton();
        await expect(programsPage.newProgramButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(modal.dialog).toBeVisible();
      });
    },
  );

  test(
    'Delete control has no axe violations in scoped scan',
    { tag: '@regression' },
    async ({ page, trackProgram }, testInfo) => {
      await runA11yCheckInCi(testInfo, 'delete-program-axe', async () => {
        const programsPage = new ProgramsPage(page);
        const programName = uniqueName('A11y Delete Program');

        await programsPage.goto();
        await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
        await createTrackedProgram(programsPage, trackProgram, programName);
        await programsPage.programDeleteButton(programName).scrollIntoViewIfNeeded();
        await expect(programsPage.programDeleteButton(programName)).toBeVisible();

        const results = await new AxeBuilder({ page })
          .include(await programsPage.deleteButtonA11ySelector(programName))
          .withTags([...axeTags])
          .analyze();
        await expectNoAxeViolations(results.violations, testInfo);
      });
    },
  );

  test(
    'keyboard focuses Delete and opens confirmation with Enter',
    { tag: '@regression' },
    async ({ page, trackProgram }, testInfo) => {
      await runA11yCheckInCi(testInfo, 'keyboard-delete-program', async () => {
        const programsPage = new ProgramsPage(page);
        const programName = uniqueName('A11y Delete Keyboard');

        await programsPage.goto();
        await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
        await createTrackedProgram(programsPage, trackProgram, programName);

        await programsPage.tabToDeleteButton(programName);
        await expect(programsPage.programDeleteButton(programName)).toBeFocused();

        const dialogPromise = page.waitForEvent('dialog');
        const enterPromise = page.keyboard.press('Enter');
        const dialog = await dialogPromise;
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain(programName);
        await dialog.dismiss();
        await enterPromise;

        await expect(programsPage.programDeleteButton(programName)).toBeVisible();
      });
    },
  );

  test(
    'New Program modal has no axe violations in scoped scan',
    { tag: '@regression' },
    async ({ page }, testInfo) => {
      await runA11yCheckInCi(testInfo, 'new-program-modal-axe', async () => {
        const programsPage = new ProgramsPage(page);
        const modal = programsPage.newProgramModal;

        await programsPage.goto();
        await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
        await programsPage.openNewProgramForm();
        await expect(modal.dialog).toBeVisible();

        const results = await new AxeBuilder({ page })
          .include(await modal.a11yIncludeSelector())
          .withTags([...axeTags])
          .analyze();

        await expectNoAxeViolations(results.violations, testInfo);
      });
    },
  );

  test(
    'Edit Program modal has no axe violations in scoped scan',
    { tag: '@regression' },
    async ({ page, trackProgram }, testInfo) => {
      await runA11yCheckInCi(testInfo, 'edit-program-modal-axe', async () => {
        const programsPage = new ProgramsPage(page);
        const modal = programsPage.editProgramModal;
        const programName = uniqueName('A11y Edit Program');

        await programsPage.goto();
        await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

        await programsPage.openNewProgramForm();
        const createResponse = page.waitForResponse(isProgramCreateResponse);
        await programsPage.createProgram(programName);
        await trackCreateFromResponse(await createResponse, trackProgram);
        await expect(programsPage.newProgramModal.dialog).toBeHidden({ timeout: 45_000 });

        await programsPage.openEditForm(programName);
        await expect(modal.dialog).toBeVisible();

        const results = await new AxeBuilder({ page })
          .include(await modal.a11yIncludeSelector())
          .withTags([...axeTags])
          .analyze();

        await expectNoAxeViolations(results.violations, testInfo);
      });
    },
  );
});
