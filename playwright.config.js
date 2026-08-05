// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    viewport: { width: 900, height: 720 }
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
