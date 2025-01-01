import { test, expect } from '@playwright/test';
import { ROUTES } from '../constants';
import { loadTestEnv } from '../../config/env';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const env = loadTestEnv();
    
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
      response => response.url().includes(`${env.apiUrl}/auth/login`)
    );

    // Submit form
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

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 });

    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const env = loadTestEnv();
    
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
      response => response.url().includes(`${env.apiUrl}/auth/login`)
    );

    // Submit form
    await submitButton.click();

    // Wait for API response
    const loginResponse = await responsePromise;

    // Wait for error message
    const errorMessage = await page.waitForSelector('[role="alert"]');
    const errorText = await errorMessage.textContent();
    
    // Verify error message
    expect(errorText).toContain('Invalid email or password');
  });
}); 