import { test as base } from '@playwright/test';
import { ROUTES } from '../tests/constants';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Extend basic test by providing a "page" fixture that navigates to the login page and logs in
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    try {
      // Use environment variable or fallback to the one from .env.test
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000';
      
      await page.goto(`${baseUrl}${ROUTES.LOGIN}`);

      // Wait for page to be ready with increased timeouts
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Wait for form elements with more reliable selectors
      const emailInput = await page.waitForSelector('input[name="email"]', { timeout: 30000, state: 'visible' });
      const passwordInput = await page.waitForSelector('input[name="password"]', { timeout: 30000, state: 'visible' });

      // Fill in credentials from test environment
      const email = process.env.TEST_ADMIN_EMAIL || 'test@test.com';
      const password = process.env.TEST_ADMIN_PASSWORD || 'testtest';
      
      // Fill in credentials with shorter delay
      await emailInput.fill(email);
      await passwordInput.fill(password);

      // Submit form and wait for navigation
      const submitButton = await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 30000 });

      // Set up response promise before clicking
      const responsePromise = page.waitForResponse(
        response => response.url().includes(`${apiUrl}/auth/login`),
        { timeout: 30000 }
      );

      // Click submit
      await submitButton.click();
      
      // Wait for API response
      const loginResponse = await responsePromise;
      const status = loginResponse.status();

      if (status !== 200) {
        let errorBody = '';
        try {
          const responseData = await loginResponse.json();
          errorBody = JSON.stringify(responseData);
        } catch (e) {
          errorBody = 'Could not parse error response';
        }
        throw new Error(`Login failed with status ${status}: ${errorBody}`);
      }

      // Wait for navigation to complete
      await page.waitForURL('**/dashboard', { timeout: 30000 });

      // Wait for dashboard content
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 });

      // Use the authenticated page
      await use(page);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  },
});

export { expect } from '@playwright/test'; 