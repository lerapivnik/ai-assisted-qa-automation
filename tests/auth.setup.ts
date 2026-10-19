import { mkdirSync } from 'fs';
import path from 'path';
import { expect, test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProgramsPage } from '../pages/ProgramsPage';
import { authStorageStatePath } from './helpers/auth';

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const programsPage = new ProgramsPage(page);

  await loginPage.goto();
  await loginPage.login(requireEnv('DIDAXIS_EMAIL'), requireEnv('DIDAXIS_PASSWORD'));
  await expect(loginPage.dashboardHeading).toBeVisible({ timeout: 30_000 });

  await programsPage.goto();
  await page.waitForURL('**/programs');
  mkdirSync(path.dirname(authStorageStatePath), { recursive: true });
  await page.context().storageState({ path: authStorageStatePath });
});
