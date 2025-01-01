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
      // Navigate to login page using full URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
      
      if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
      if (!apiUrl) throw new Error('NEXT_PUBLIC_ERP_API_URL environment variable is not set');

      await page.goto(`${baseUrl}${ROUTES.LOGIN}`);

      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');

      // Wait for form to be ready
      const form = await page.waitForSelector('form', { state: 'visible', timeout: 10000 });

      // Wait for form elements with more reliable selectors
      const emailInput = await page.waitForSelector('input[name="email"]', { timeout: 10000, state: 'visible' });
      const passwordInput = await page.waitForSelector('input[name="password"]', { timeout: 10000, state: 'visible' });

      // Fill in credentials from test environment
      const email = process.env.TEST_ADMIN_EMAIL;
      const password = process.env.TEST_ADMIN_PASSWORD;
      
      if (!email || !password) {
        throw new Error('Test credentials not found in environment variables');
      }
      
      // Fill in credentials with delay between characters
      await emailInput.focus();
      await emailInput.type(email, { delay: 100 });
      await passwordInput.focus();
      await passwordInput.type(password, { delay: 100 });

      // Submit form and wait for navigation
      const submitButton = await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 10000 });

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