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
      // Enable request/response logging for all requests
      page.on('request', request => {
        console.log('Request:', {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      });

      page.on('response', async response => {
        const status = response.status();
        const url = response.url();
        let responseBody = '';
        
        try {
          if (response.headers()['content-type']?.includes('application/json')) {
            responseBody = JSON.stringify(await response.json());
          }
        } catch (e) {
          responseBody = 'Could not parse response body';
        }

        console.log('Response:', {
          url,
          status,
          statusText: response.statusText(),
          headers: response.headers(),
          body: responseBody
        });
      });

      // Navigate to login page using full URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
      const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000';
      console.log('Using URLs:', { baseUrl, apiUrl });

      await page.goto(`${baseUrl}${ROUTES.LOGIN}`);
      console.log('Successfully navigated to login page');

      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      console.log('Page loaded, waiting for form elements');

      // Wait for form to be ready
      const form = await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
      console.log('Form found');

      // Wait for form elements with more reliable selectors
      const emailInput = await page.waitForSelector('input[name="email"]', { timeout: 10000, state: 'visible' });
      const passwordInput = await page.waitForSelector('input[name="password"]', { timeout: 10000, state: 'visible' });
      console.log('Form elements found');

      // Fill in credentials from test environment
      const email = process.env.TEST_ADMIN_EMAIL;
      const password = process.env.TEST_ADMIN_PASSWORD;
      
      if (!email || !password) {
        throw new Error('Test credentials not found in environment variables');
      }
      
      console.log('Using credentials:', { email, password: '********' });
      
      // Fill in credentials with delay between characters
      await emailInput.focus();
      await emailInput.type(email, { delay: 100 });
      await passwordInput.focus();
      await passwordInput.type(password, { delay: 100 });
      console.log('Credentials filled');

      // Submit form and wait for navigation
      console.log('Submitting login form...');
      const submitButton = await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 10000 });

      // Set up response promise before clicking
      const responsePromise = page.waitForResponse(
        response => {
          const isLoginUrl = response.url().includes(`${apiUrl}/auth/login`);
          console.log('Checking response:', { url: response.url(), isLoginUrl });
          return isLoginUrl;
        },
        { timeout: 30000 }
      );

      // Click submit
      await submitButton.click();
      
      // Wait for API response
      const loginResponse = await responsePromise;
      const status = loginResponse.status();
      console.log('Login API response received:', { status });

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
      console.log('Navigation to dashboard completed');

      // Wait for dashboard content
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 });
      console.log('Dashboard content loaded');

      // Use the authenticated page
      await use(page);
    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Take a screenshot on error
      try {
        await page.screenshot({ path: 'test-results/auth-error.png' });
        console.log('Error screenshot saved to test-results/auth-error.png');
      } catch (screenshotError) {
        console.error('Failed to take error screenshot:', screenshotError);
      }
      
      throw error;
    }
  },
});

export { expect } from '@playwright/test'; 