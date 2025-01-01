import { loadTestEnv } from './env';
import { chromium } from '@playwright/test';
import fetch from 'node-fetch';

async function waitForBackend(url: string, maxAttempts = 5, interval = 1000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('✓ Backend server is ready');
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Backend not ready yet...`);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return false;
}

async function globalSetup() {
  const env = loadTestEnv();
  
  // Verify backend is available
  const isBackendReady = await waitForBackend(`${env.apiUrl}/api`);
  if (!isBackendReady) {
    console.error('❌ Backend server is not responding. Please ensure it is running at ' + env.apiUrl);
    process.exit(1);
  }

  // Set up browser
  const browser = await chromium.launch();
  await browser.close();
}

export default globalSetup; 