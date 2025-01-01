import { PlaywrightTestConfig } from '@playwright/test';
import { loadTestEnv } from './env';

// Load and validate environment variables
const env = loadTestEnv();

const config: PlaywrightTestConfig = {
  testDir: '../tests',
  timeout: 60000,
  retries: process.env.CI ? 2 : 1,
  use: {
    baseURL: env.appUrl,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 30000,
    navigationTimeout: 30000,
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
    ['html', { outputFolder: '../test-output/html-report' }],
    ['junit', { outputFile: '../test-output/junit/results.xml' }],
    ['list']
  ],
  outputDir: '../test-output/test-results',
  globalSetup: require.resolve('./global-setup'),
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  maxFailures: 0,
};

export default config; 