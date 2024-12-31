import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

async function globalSetup(config: FullConfig) {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });

  // Add any global setup here (e.g., database seeding, test data setup)
}

export default globalSetup; 