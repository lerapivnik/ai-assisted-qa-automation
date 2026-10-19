// @ts-check
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const authStorageState = 'playwright/.auth/user.json';

/** @param {string} name @param {string} device */
function authenticatedBrowserProject(name, device) {
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

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  testDir: './tests',
  testIgnore: '**/*.manual.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
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
