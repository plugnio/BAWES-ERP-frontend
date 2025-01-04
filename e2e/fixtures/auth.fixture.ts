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
    try {
      // Use environment variable or fallback to the one from .env.test
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000';
      
      // Add route handler for token refresh
      await debugPage.route(`${apiUrl}/auth/refresh`, async (route) => {
        try {
          const response = await route.fetch();
          const status = response.status();
          
          if (status === 401) {
            // If refresh fails, redirect to login
            await debugPage.goto(`${baseUrl}${ROUTES.LOGIN}`);
            return;
          }
          
          await route.fulfill({ response });
        } catch (error) {
          console.error('Error in refresh route handler:', error);
          await route.continue();
        }
      });
      
      // Add route handler for 401 responses
      await debugPage.route('**/*', async (route) => {
        try {
          const response = await route.fetch();
          const status = response.status();
          
          if (status === 401) {
            // Try to refresh token
            const refreshResponse = await debugPage.request.post(`${apiUrl}/auth/refresh`);
            
            if (refreshResponse.ok()) {
              // Token refreshed, retry original request
              const retryResponse = await route.fetch();
              await route.fulfill({ response: retryResponse });
              return;
            }
            
            // If refresh fails, redirect to login
            await debugPage.goto(`${baseUrl}${ROUTES.LOGIN}`);
            return;
          }
          
          await route.fulfill({ response });
        } catch (error) {
          console.error('Error in 401 route handler:', error);
          await route.continue();
        }
      });
      
      // Navigate to login page
      await debugPage.goto(`${baseUrl}${ROUTES.LOGIN}`);
      await debugPage.waitForLoadState('domcontentloaded', { timeout: 30000 });

      // Wait for form elements with more reliable selectors
      const emailInput = await debugPage.waitForSelector('input[type="email"]', { 
        state: 'visible',
        timeout: 30000 
      });
      const passwordInput = await debugPage.waitForSelector('input[type="password"]', { 
        state: 'visible',
        timeout: 30000 
      });

      // Fill in credentials from test environment
      const email = process.env.TEST_ADMIN_EMAIL || 'test@test.com';
      const password = process.env.TEST_ADMIN_PASSWORD || 'testtest';
      
      // Fill in credentials
      await emailInput.fill(email);
      await passwordInput.fill(password);

      // Submit form and wait for navigation
      const submitButton = await debugPage.waitForSelector('button[type="submit"]', { 
        state: 'visible',
        timeout: 30000 
      });

      // Set up response promise before clicking
      const responsePromise = debugPage.waitForResponse(
        (response: Response) => response.url().includes(`${apiUrl}/auth/login`),
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
      await debugPage.waitForURL('**/dashboard', { timeout: 30000 });

      // Wait for dashboard content with increased timeout
      await debugPage.waitForSelector('[data-testid="dashboard"]', { 
        state: 'visible',
        timeout: 30000 
      });

      // Use the authenticated page
      await use(debugPage);
      
      // Cleanup routes after test
      await debugPage.unrouteAll({ behavior: 'ignoreErrors' });
    } catch (error) {
      console.error('Authentication failed:', error);
      // Cleanup routes on error
      await debugPage.unrouteAll({ behavior: 'ignoreErrors' });
      throw error;
    }
  },
});

export { expect } from '@playwright/test'; 