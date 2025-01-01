import { PlaywrightTestConfig } from '@playwright/test';
import { loadTestEnv } from './env';

// Load and validate environment variables
const env = loadTestEnv();

const config: PlaywrightTestConfig = {
  testDir: '../tests',
  timeout: 10000,
  retries: process.env.CI ? 0 : 0,
  use: {
    baseURL: env.appUrl,
    trace: process.env.CI ? 'on-first-retry' : 'on',
    screenshot: process.env.CI ? 'only-on-failure' : 'on',
    video: process.env.CI ? 'retain-on-failure' : 'on',
    actionTimeout: 5000,
    navigationTimeout: 5000,
  },
  projects: [
    {
      name: 'Chrome',
      use: { 
        browserName: 'chromium',
        launchOptions: {
          args: ['--disable-dev-shm-usage']
        }
      },
    }
  ],
  reporter: [
    ['html', { 
      outputFolder: '../test-output/html-report',
      open: 'never'
    }],
    ['junit', { outputFile: '../test-output/junit/results.xml' }],
    ['list']
  ],
  outputDir: '../test-output/test-results',
  globalSetup: require.resolve('./global-setup'),
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: !process.env.CI,
  maxFailures: process.env.CI ? 10 : 0,
};

export default config; 