import { FullConfig } from '@playwright/test';
import { loadTestEnv } from './env';

async function globalSetup(config: FullConfig) {
    // Load and validate test environment variables
    loadTestEnv();
}

export default globalSetup; 