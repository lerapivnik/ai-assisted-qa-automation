// @ts-check
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  testDir: './manual',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html']],
  use: {
    trace: 'off',
    baseURL: process.env.DIDAXIS_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
