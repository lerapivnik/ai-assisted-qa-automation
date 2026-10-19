import path from 'path';
import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export const authStorageStatePath = path.join(
  __dirname,
  '../../playwright/.auth/user.json',
);

export async function openPrograms(page: Page): Promise<void> {
  await page.goto('/programs');
  await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('button', { name: '+ New Program' })).toBeVisible({
    timeout: 30_000,
  });
}

export async function newAuthenticatedContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: authStorageStatePath });
}
