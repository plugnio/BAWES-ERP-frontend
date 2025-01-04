import { test as base, Page, Response } from '@playwright/test';
import { ROUTES } from '../tests/constants';
import dotenv from 'dotenv';
import path from 'path';
import { test as debugTest } from './debug.fixture';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

interface AuthFixtures {
  authenticatedPage: Page;
}

// Extend debug test by providing a "page" fixture that navigates to the login page and logs in
export const test = debugTest.extend<AuthFixtures>({
  authenticatedPage: async ({ debugPage }, use) => {
    // Use environment variable or fallback to the one from .env.test
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000';
    
    try {
      // Navigate to login page first
      await debugPage.goto(`${baseUrl}${ROUTES.LOGIN}`);
      
      // Wait for form elements
      const emailInput = await debugPage.waitForSelector('input[type="email"]');
      const passwordInput = await debugPage.waitForSelector('input[type="password"]');
      const submitButton = await debugPage.waitForSelector('button[type="submit"]');

      // Fill in credentials from test environment
      const email = process.env.TEST_ADMIN_EMAIL || 'test@test.com';
      const password = process.env.TEST_ADMIN_PASSWORD || 'testtest';
      
      await emailInput.fill(email);
      await passwordInput.fill(password);

      // Set up response promise before clicking
      const responsePromise = debugPage.waitForResponse(
        (response: Response) => response.url().includes(`${apiUrl}/auth/login`)
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
      await debugPage.waitForURL('**/dashboard');

      // Wait for dashboard content
      await debugPage.waitForSelector('[data-testid="dashboard"]');

      // Now that we're authenticated, set up the refresh token handler
      await debugPage.route(`${apiUrl}/auth/refresh`, async (route) => {
        const response = await route.fetch();
        if (response.ok()) {
          await route.fulfill({ response });
        } else {
          // If refresh fails, let the app handle the redirect
          await route.continue();
        }
      });

      // Use the authenticated page
      await use(debugPage);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    } finally {
      // Always clean up routes
      await debugPage.unrouteAll();
    }
  },
});

export { expect } from '@playwright/test'; 