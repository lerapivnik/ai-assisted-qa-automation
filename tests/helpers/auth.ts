import path from 'path';
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { ProgramsPage } from '../../pages/ProgramsPage';

export const authStorageStatePath = path.join(
  __dirname,
  '../../playwright/.auth/user.json',
);

export async function openPrograms(page: Page): Promise<ProgramsPage> {
  const programsPage = new ProgramsPage(page);
  await programsPage.goto();
  await expect(programsPage.heading).toBeVisible({ timeout: 30_000 });
  await expect(programsPage.newProgramButton).toBeVisible({ timeout: 30_000 });
  return programsPage;
}

export async function newAuthenticatedContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: authStorageStatePath });
}
