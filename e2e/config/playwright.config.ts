import { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const config: PlaywrightTestConfig = {
  testDir: '../tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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
  // Folder for test artifacts (screenshots, videos, etc.)
  outputDir: 'test-results',
  // Global setup
  globalSetup: require.resolve('./global-setup'),
  // Workers
  workers: process.env.CI ? 1 : undefined,
};

export default config; 