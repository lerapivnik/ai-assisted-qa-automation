import { expect, test, type Page } from '../fixtures/cleanup.fixture';
import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import { openPrograms } from './helpers/auth';
import { createTrackedProgram, nameOfLength, uniqueName } from './helpers/programs';

/** DS-4 does not define a max length. This matches the 255-character edge in the plan. */
const ASSUMED_PROGRAM_NAME_LENGTH = 255;

const DELETE_ERROR_STATUSES = [503, 400, 409, 500, 501, 502, 504] as const;
const LIST_ERROR_STATUSES = [401, 403, 404] as const;

function isProgramsCollectionUrl(url: URL): boolean {
  const pathname = url.pathname.replace(/\/$/, '');
  return pathname === '/api/programs' || pathname.endsWith('/api/programs');
}

function isProgramItemUrl(url: URL): boolean {
  return /\/api\/programs\/[^/]+$/.test(url.pathname);
}

function isProgramDeleteResponse(response: {
  url(): string;
  request(): { method(): string };
}): boolean {
  if (response.request().method() !== 'DELETE') {
    return false;
  }
  try {
    return isProgramItemUrl(new URL(response.url()));
  } catch {
    return false;
  }
}

function isProgramListResponse(
  response: { url(): string; request(): { method(): string }; status(): number },
  status: number,
): boolean {
  if (response.request().method() !== 'GET' || response.status() !== status) {
    return false;
  }
  try {
    return isProgramsCollectionUrl(new URL(response.url()));
  } catch {
    return false;
  }
}

/**
 * Fulfill GET /api/programs only. Other methods on that path continue.
 */
async function fulfillProgramList(page: Page, status: number, body: string): Promise<void> {
  await page.route(isProgramsCollectionUrl, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body,
    });
  });
}

/**
 * Fulfill DELETE /api/programs/<uuid> only. Other methods continue.
 * Happy-path tests do not call this.
 */
async function fulfillProgramDelete(page: Page, status: number, body: string): Promise<void> {
  await page.route(isProgramItemUrl, async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.continue();
      return;
    }
    if (body.length === 0) {
      await route.fulfill({ status, body: '' });
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body,
    });
  });
}

async function confirmDelete(programsPage: ProgramsPage, programName: string): Promise<void> {
  const dialogPromise = programsPage.page.waitForEvent('dialog');
  const deleteResponse = programsPage.page.waitForResponse(isProgramDeleteResponse);
  const clickPromise = programsPage.clickDelete(programName);
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe('confirm');
  await dialog.accept();
  await clickPromise;
  await deleteResponse;
}

async function dismissDelete(programsPage: ProgramsPage, programName: string): Promise<void> {
  const dialogPromise = programsPage.page.waitForEvent('dialog');
  const clickPromise = programsPage.clickDelete(programName);
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe('confirm');
  await dialog.dismiss();
  await clickPromise;
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

  // Rapid double-click can queue two native confirms. Not in the DS-4 scenarios.

  test.describe('authenticated admin', () => {
    test.beforeEach(async ({ page }) => {
      await openPrograms(page);
    });

    test('TC-001: Delete program with confirmation', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);
      await expectProgramRemoved(programsPage, programName);
    });

    test('TC-002: Cancel program deletion', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      // Native confirm: Cancel is dialog.dismiss(). The Cancel label was not read this run.
      await dismissDelete(programsPage, programName);
      await expectProgramStillListed(programsPage, programName);
    });

    test('TC-004: Dismissing the confirmation leaves the program in the list', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      // Native confirm has no separate dismiss control from Cancel. dialog.dismiss()
      // is the non-confirming path. Dialog message copy was not read this run.
      await dismissDelete(programsPage, programName);
      await expectProgramStillListed(programsPage, programName);
    });

    test('TC-007: Program with special characters in the name can be deleted', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Informatique & IA - Niveau 2');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);
      await expectProgramRemoved(programsPage, programName);
    });

    test('TC-008: Deleted program stays gone after the Programs page is reloaded', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);

      await confirmDelete(programsPage, programName);
      await expectProgramRemoved(programsPage, programName);

      await programsPage.reloadList();
      await expect(programsPage.heading).toBeVisible();
      await expectProgramRemoved(programsPage, programName);
    });

    test('TC-009: Confirmation can be cancelled for a program with a very long name', async ({
      page,
      trackProgram,
    }) => {
      const programsPage = new ProgramsPage(page);
      const programName = nameOfLength(ASSUMED_PROGRAM_NAME_LENGTH);
      await createTrackedProgram(programsPage, trackProgram, programName);

      // Dialog message copy was not read this run.
      await dismissDelete(programsPage, programName);
      await expectProgramStillListed(programsPage, programName);
    });

    for (const status of DELETE_ERROR_STATUSES) {
      test(`Delete returns ${status}`, async ({ page, trackProgram }) => {
        const programsPage = new ProgramsPage(page);
        const programName = uniqueName('Test Program');
        await createTrackedProgram(programsPage, trackProgram, programName);
        await fulfillProgramDelete(page, status, '{}');

        await confirmDelete(programsPage, programName);

        // Visible error sentence was not read because DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set.
        await expect(programsPage.heading).toBeVisible();
        await expectProgramStillListed(programsPage, programName);
      });
    }

    test('Delete returns 204 with an empty body', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);
      await fulfillProgramDelete(page, 204, '');

      await confirmDelete(programsPage, programName);

      // No visible sentence was read because DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set.
      await expect(programsPage.heading).toBeVisible();
    });

    test('Delete returns 300', async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const programName = uniqueName('Test Program');
      await createTrackedProgram(programsPage, trackProgram, programName);
      await fulfillProgramDelete(page, 300, '');

      await confirmDelete(programsPage, programName);

      // No visible sentence was read because DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set.
      await expect(programsPage.heading).toBeVisible();
    });
  });

  test.describe('program list API', () => {
    test('Program list returns 200 with an empty array', async ({ page }) => {
      await fulfillProgramList(page, 200, '[]');
      const programsPage = new ProgramsPage(page);
      const listResponse = page.waitForResponse((response) =>
        isProgramListResponse(response, 200),
      );
      await programsPage.goto();
      await listResponse;

      // Empty-state sentence was not read because DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set.
      await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
      await expect(programsPage.programDataRows).toHaveCount(0);
    });

    test('Program list returns 200 with a malformed body', async ({ page }) => {
      await fulfillProgramList(page, 200, '{"unexpected":true}');
      const programsPage = new ProgramsPage(page);
      const listResponse = page.waitForResponse((response) =>
        isProgramListResponse(response, 200),
      );
      await programsPage.goto();
      await listResponse;

      // No extra copy was read from the live page because DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set.
      await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
    });

    for (const status of LIST_ERROR_STATUSES) {
      test(`Program list returns ${status}`, async ({ page }) => {
        await fulfillProgramList(page, status, '{}');
        const programsPage = new ProgramsPage(page);
        const listResponse = page.waitForResponse((response) =>
          isProgramListResponse(response, status),
        );
        await programsPage.goto();
        await listResponse;

        // Visible sentence was not read because DIDAXIS_EMAIL and DIDAXIS_PASSWORD were not set.
        await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
      });
    }
  });

  test('TC-005: Unauthenticated user cannot delete a program', async ({ browser }) => {
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
