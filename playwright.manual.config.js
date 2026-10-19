// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const baseConfig = require('./playwright.config');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: '**/purge-programs.manual.spec.ts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'line',
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
});
