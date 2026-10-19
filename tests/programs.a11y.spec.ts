import AxeBuilder from '@axe-core/playwright';
import {
  expect,
  isProgramCreateResponse,
  test,
  trackCreateFromResponse,
} from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName } from './helpers/programs';

const axeTags = ['wcag2a', 'wcag2aa'] as const;

test.describe('Programs accessibility', () => {
  test.describe.configure({ timeout: 120_000 });

  test('Programs page has no axe violations', { tag: '@regression' }, async ({ page }) => {
    const programsPage = new ProgramsPage(page);

    await programsPage.goto();
    await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

    const results = await new AxeBuilder({ page }).withTags([...axeTags]).analyze();
    await expect(results.violations).toEqual([]);
  });

  test(
    'keyboard focuses New Program and opens dialog with Enter',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.goto();
      await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });

      await programsPage.tabToNewProgramButton();
      await expect(programsPage.newProgramButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(modal.dialog).toBeVisible();
    },
  );

  test(
    'New Program modal has no axe violations in scoped scan',
    { tag: '@regression' },
    async ({ page }) => {
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

      await expect(results.violations).toEqual([]);
    },
  );

  test(
    'Edit Program modal has no axe violations in scoped scan',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
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

      await expect(results.violations).toEqual([]);
    },
  );
});
