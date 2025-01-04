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
        const response = await route.fetch();
        const status = response.status();
        
        if (status === 401) {
          // If refresh fails, redirect to login
          await debugPage.goto(`${baseUrl}${ROUTES.LOGIN}`);
          return;
        }
        
        await route.fulfill({ response });
      });
      
      await debugPage.goto(`${baseUrl}${ROUTES.LOGIN}`);

      // Wait for page to be ready with increased timeouts
      await debugPage.waitForLoadState('domcontentloaded');
      await debugPage.waitForLoadState('networkidle');

      // Wait for form elements with more reliable selectors
      const emailInput = await debugPage.waitForSelector('input[name="email"]', { state: 'visible' });
      const passwordInput = await debugPage.waitForSelector('input[name="password"]', { state: 'visible' });

      // Fill in credentials from test environment
      const email = process.env.TEST_ADMIN_EMAIL || 'test@test.com';
      const password = process.env.TEST_ADMIN_PASSWORD || 'testtest';
      
      // Fill in credentials with shorter delay
      await emailInput.fill(email);
      await passwordInput.fill(password);

      // Submit form and wait for navigation
      const submitButton = await debugPage.waitForSelector('button[type="submit"]', { state: 'visible'});

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
      await debugPage.waitForURL('**/dashboard');

      // Wait for dashboard content
      await debugPage.waitForSelector('[data-testid="dashboard"]');

      // Add route handler for 401 responses
      await debugPage.route('**/*', async (route) => {
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
      });

      // Use the authenticated page
      await use(debugPage);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  },
});

export { expect } from '@playwright/test'; 