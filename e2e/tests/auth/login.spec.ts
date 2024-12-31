import { test, expect } from '@playwright/test';
import { ROUTES } from '../constants';
import { loadTestEnv } from '../../config/env';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const env = loadTestEnv();
    
    // Enable request/response logging
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
    
    // Navigate to login page
    await page.goto(`${env.appUrl}${ROUTES.LOGIN}`);
    
    // Wait for form elements
    const emailInput = await page.waitForSelector('input[name="email"]');
    const passwordInput = await page.waitForSelector('input[name="password"]');
    const submitButton = await page.waitForSelector('button[type="submit"]');

    // Fill in credentials
    await emailInput.fill(env.testEmail);
    await passwordInput.fill(env.testPassword);

    // Set up response promise before clicking
    const responsePromise = page.waitForResponse(
      response => {
        const isLoginUrl = response.url().includes(`${env.apiUrl}/auth/login`);
        console.log('Checking response:', { url: response.url(), isLoginUrl });
        return isLoginUrl;
      }
    );

    // Submit form
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

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 });

    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const env = loadTestEnv();
    
    // Enable request/response logging
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
    
    // Navigate to login page
    await page.goto(`${env.appUrl}${ROUTES.LOGIN}`);
    
    // Wait for form elements
    const emailInput = await page.waitForSelector('input[name="email"]');
    const passwordInput = await page.waitForSelector('input[name="password"]');
    const submitButton = await page.waitForSelector('button[type="submit"]');

    // Fill in invalid credentials
    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword');

    // Set up response promise before clicking
    const responsePromise = page.waitForResponse(
      response => {
        const isLoginUrl = response.url().includes(`${env.apiUrl}/auth/login`);
        console.log('Checking response:', { url: response.url(), isLoginUrl });
        return isLoginUrl;
      }
    );

    // Submit form
    await submitButton.click();

    // Wait for API response
    const loginResponse = await responsePromise;
    const status = loginResponse.status();
    console.log('Login API response received:', { status });

    // Wait for error message
    const errorMessage = await page.waitForSelector('[role="alert"]');
    const errorText = await errorMessage.textContent();
    
    // Verify error message
    expect(errorText).toContain('Invalid email or password');
  });
}); 