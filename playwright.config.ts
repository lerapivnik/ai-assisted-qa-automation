import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const authStorageState = 'playwright/.auth/user.json';

function authenticatedBrowserProject(
  name: string,
  device: keyof typeof devices,
) {
  return {
    name,
    use: {
      ...devices[device],
      storageState: authStorageState,
    },
    dependencies: ['setup'],
    testIgnore: [/.*\.setup\.ts/, /.*\.manual\.spec\.ts/],
  };
}

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/*.manual.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    trace: 'on-first-retry',
    baseURL: process.env.DIDAXIS_URL,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    authenticatedBrowserProject('chromium', 'Desktop Chrome'),
    authenticatedBrowserProject('firefox', 'Desktop Firefox'),
    authenticatedBrowserProject('webkit', 'Desktop Safari'),
  ],
});
