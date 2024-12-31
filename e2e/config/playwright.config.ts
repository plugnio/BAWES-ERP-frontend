import { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables from the workspace root
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

const config: PlaywrightTestConfig = {
  testDir: '../tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
  ],
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  outputDir: 'test-results',
  globalSetup: require.resolve('./global-setup'),
  workers: process.env.CI ? 1 : undefined,
};

export default config; 