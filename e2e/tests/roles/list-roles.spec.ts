import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';
import { ROUTES, API_ENDPOINTS } from '../constants';
import type { APIResponse } from '@playwright/test';

test.describe('Roles List Page', () => {
  test('loads and displays roles with optimized API calls', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to roles page using base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    
    if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    if (!apiUrl) throw new Error('NEXT_PUBLIC_ERP_API_URL environment variable is not set');
    
    // Wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => response.url().includes(`${apiUrl}${API_ENDPOINTS.ROLES}`),
        { timeout: 60000 }
      ),
      page.goto(`${baseUrl}${ROUTES.ROLES}`),
      page.waitForLoadState('networkidle')
    ]);
    
    expect(response.ok()).toBeTruthy();

    // Verify UI elements
    await expect(page.locator('h1')).toHaveText('Role Management', { timeout: 60000 });
    
    // Wait for loading spinner to disappear
    await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 60000 });
    
    // Wait for roles to load
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Drag to reorder roles and click to manage permissions')).toBeVisible({ timeout: 60000 });
    
    const roleButtons = await page.getByRole('button').filter({ hasText: /^(?!New Role|Save).*/ }).count();
    expect(roleButtons).toBeGreaterThan(0);

    // Check API calls
    const rolesCalls = apiTracker.getCallsByEndpoint(API_ENDPOINTS.ROLES);
    expect(rolesCalls.length, 'Multiple calls to roles endpoint detected').toBe(1);

    // Verify caching on re-navigation
    await page.goto(`${baseUrl}${ROUTES.DASHBOARD}`);
    await page.goto(`${baseUrl}${ROUTES.ROLES}`);
    await page.waitForLoadState('networkidle');
    
    const newCalls = apiTracker.getCallsSince(rolesCalls.length);
    const newRolesCalls = newCalls.filter(call => 
      call.url.includes(`${apiUrl}${API_ENDPOINTS.ROLES}`)
    );
    
    expect(newRolesCalls.length, 'Should make one API call per page visit').toBe(1);
  });

  test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to roles page using base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    
    if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
    if (!apiUrl) throw new Error('NEXT_PUBLIC_ERP_API_URL environment variable is not set');
    
    // Wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => response.url().includes(`${apiUrl}${API_ENDPOINTS.ROLES}`),
        { timeout: 60000 }
      ),
      page.goto(`${baseUrl}${ROUTES.ROLES}`),
      page.waitForLoadState('networkidle')
    ]);
    
    expect(response.ok()).toBeTruthy();

    // Wait for loading spinner to disappear
    await expect(page.getByTestId('loading-spinner')).toBeHidden({ timeout: 60000 });
    
    // Wait for page to be ready
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible({ timeout: 60000 });
    
    // Clear previous calls
    apiTracker.clear();
    
    // Create new role
    const newRoleButton = page.getByRole('button', { name: /new role/i });
    await expect(newRoleButton).toBeVisible({ timeout: 60000 });
    await newRoleButton.click();
    
    const roleNameInput = page.getByLabel(/role name/i);
    await expect(roleNameInput).toBeVisible({ timeout: 60000 });
    await roleNameInput.fill('Test Role');
    
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 60000 });
    await saveButton.click();

    // Verify API efficiency
    const createCalls = apiTracker.getCallsByMethod('POST');
    expect(createCalls.length, 'Multiple create calls detected').toBe(1);
  });
}); 