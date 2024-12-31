import { test as base, Page } from '@playwright/test';

// Extend the base test type
export type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || '');
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || '');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('/dashboard');
    
    // Make the authenticated page available
    await use(page);
  },
});

export { expect } from '@playwright/test'; 