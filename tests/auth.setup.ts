import { mkdirSync } from 'fs';
import path from 'path';
import { expect, test as setup } from '@playwright/test';
import { authStorageStatePath } from './helpers/auth';

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

setup('authenticate', async ({ page }) => {
  await page.goto('https://test.didaxis.studio/login');
  await page.getByLabel('Email').fill(requireEnv('DIDAXIS_EMAIL'));
  await page.getByLabel('Password').fill(requireEnv('DIDAXIS_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
    timeout: 30_000,
  });
  await page.goto('https://test.didaxis.studio/programs');
  await page.waitForURL('**/programs');
  mkdirSync(path.dirname(authStorageStatePath), { recursive: true });
  await page.context().storageState({ path: authStorageStatePath });
});
