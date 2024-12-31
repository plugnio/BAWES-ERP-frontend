import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';

test.describe('Roles List Page', () => {
  test('loads and displays roles with optimized API calls', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to roles page
    await page.goto('/roles');
    await page.waitForLoadState('networkidle');

    // Verify UI elements
    await expect(page.locator('h1')).toHaveText('Roles');
    await expect(page.locator('table')).toBeVisible();
    const rows = await page.getByRole('row').count();
    expect(rows).toBeGreaterThan(0);

    // Check API calls
    const rolesCalls = apiTracker.getCallsByEndpoint('/api/roles');
    
    // Currently making multiple calls, should be optimized to one
    expect(rolesCalls.length, 'Multiple calls to roles endpoint detected').toBe(1);

    // Verify caching on re-navigation
    await page.goto('/dashboard');
    await page.goto('/roles');
    await page.waitForLoadState('networkidle');
    
    const newCalls = apiTracker.getCallsSince(rolesCalls.length);
    const newRolesCalls = newCalls.filter(call => call.url.includes('/api/roles'));
    
    expect(newRolesCalls.length, 'Additional API calls made on revisit').toBe(0);
  });

  test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to roles page
    await page.goto('/roles');
    await page.waitForLoadState('networkidle');
    
    // Clear previous calls
    apiTracker.clear();
    
    // Create new role
    await page.getByRole('button', { name: /create role/i }).click();
    await page.getByLabel(/role name/i).fill('Test Role');
    await page.getByRole('button', { name: /save/i }).click();

    // Verify API efficiency
    const createCalls = apiTracker.getCallsByMethod('POST');
    expect(createCalls.length, 'Multiple create calls detected').toBe(1);
    
    // Verify no unnecessary GET calls after creation
    const getCalls = apiTracker.getCallsByMethod('GET');
    expect(getCalls.length, 'Unnecessary GET calls after creation').toBe(1);
  });
}); 