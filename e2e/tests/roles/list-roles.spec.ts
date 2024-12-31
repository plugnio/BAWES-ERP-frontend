import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';
import { ROUTES, API_ENDPOINTS } from '../constants';
import type { APIResponse } from '@playwright/test';

test.describe('Roles List Page', () => {
  test('loads and displays roles with optimized API calls', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to roles page using base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    
    // Wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => response.url().includes('/permissions/dashboard'),
        { timeout: 30000 }
      ),
      page.goto(`${baseUrl}${ROUTES.ROLES}`),
      page.waitForLoadState('networkidle')
    ]);
    
    expect(response.ok()).toBeTruthy();

    // Verify UI elements
    await expect(page.locator('h1')).toHaveText('Role Management', { timeout: 30000 });
    
    // Wait for loading spinner to disappear
    await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 30000 });
    
    // Wait for roles to load
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Drag to reorder roles and click to manage permissions')).toBeVisible({ timeout: 30000 });
    
    const roleButtons = await page.getByRole('button').filter({ hasText: /^(?!New Role|Save).*/ }).count();
    expect(roleButtons).toBeGreaterThan(0);

    // Check API calls
    const rolesCalls = apiTracker.getCallsByEndpoint(API_ENDPOINTS.ROLES);
    
    // Currently making multiple calls, should be optimized to one
    expect(rolesCalls.length, 'Multiple calls to roles endpoint detected').toBe(1);

    // Verify caching on re-navigation
    await page.goto(`${baseUrl}${ROUTES.DASHBOARD}`);
    await page.goto(`${baseUrl}${ROUTES.ROLES}`);
    await page.waitForLoadState('networkidle');
    
    const newCalls = apiTracker.getCallsSince(rolesCalls.length);
    const newRolesCalls = newCalls.filter(call => 
      call.url.includes(API_ENDPOINTS.ROLES)
    );
    
    expect(newRolesCalls.length, 'Additional API calls made on revisit').toBe(0);
  });

  test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to roles page using base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    
    // Wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => response.url().includes('/permissions/dashboard'),
        { timeout: 30000 }
      ),
      page.goto(`${baseUrl}${ROUTES.ROLES}`),
      page.waitForLoadState('networkidle')
    ]);
    
    expect(response.ok()).toBeTruthy();
    
    // Wait for loading spinner to disappear
    await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 30000 });
    
    // Wait for page to be ready
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible({ timeout: 30000 });
    
    // Clear previous calls
    apiTracker.clear();
    
    // Create new role
    const newRoleButton = page.getByRole('button', { name: /new role/i });
    await expect(newRoleButton).toBeVisible({ timeout: 30000 });
    await newRoleButton.click();
    
    const roleNameInput = page.getByLabel(/role name/i);
    await expect(roleNameInput).toBeVisible({ timeout: 30000 });
    await roleNameInput.fill('Test Role');
    
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 30000 });
    await saveButton.click();

    // Verify API efficiency
    const createCalls = apiTracker.getCallsByMethod('POST');
    expect(createCalls.length, 'Multiple create calls detected').toBe(1);
    
    // Verify no unnecessary GET calls after creation
    const getCalls = apiTracker.getCallsByMethod('GET');
    expect(getCalls.length, 'Unnecessary GET calls after creation').toBe(1);
  });
}); 