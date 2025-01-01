import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';
import { ROUTES, API_ENDPOINTS } from '../constants';
import type { APIResponse } from '@playwright/test';

test.describe('Roles List Page', () => {
  test('loads and displays roles with optimized API calls', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    if (!apiUrl) throw new Error('NEXT_PUBLIC_ERP_API_URL environment variable is not set');
    
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for critical UI elements
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Drag to reorder roles and click to manage permissions')).toBeVisible();
    
    // Verify roles are loaded
    const roleButtons = await page.getByRole('button').filter({ hasText: /^(?!New Role|Save).*/ }).count();
    expect(roleButtons).toBeGreaterThan(0);

    // Check API calls
    const rolesCalls = apiTracker.getCallsByEndpoint(API_ENDPOINTS.ROLES);
    expect(rolesCalls.length, 'Multiple calls to roles endpoint detected').toBe(1);

    // Verify caching on re-navigation
    await page.goto(ROUTES.DASHBOARD);
    
    // Track API calls before navigating back
    const beforeNavigation = apiTracker.getCallsSince(rolesCalls.length);
    
    // Navigate back to roles
    await page.goto(ROUTES.ROLES);
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check API calls after navigation
    const afterNavigation = apiTracker.getCallsSince(beforeNavigation.length + rolesCalls.length);
    const newRolesCalls = afterNavigation.filter(call => 
      call.url.includes(`${apiUrl}${API_ENDPOINTS.ROLES}`)
    );
    
    expect(newRolesCalls.length, 'Should make one API call per page visit').toBe(1);
  });

  test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    if (!apiUrl) throw new Error('NEXT_PUBLIC_ERP_API_URL environment variable is not set');
    
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for UI to be ready
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Clear previous calls before role creation
    apiTracker.clear();
    
    // Create new role
    const newRoleButton = page.getByRole('button', { name: /new role/i });
    await newRoleButton.click();
    
    // Fill role name
    const roleNameInput = page.getByLabel(/role name/i);
    await expect(roleNameInput).toBeVisible();
    await roleNameInput.fill('Test Role');
    
    // Save and wait for response
    const saveButton = page.getByRole('button', { name: /save/i });
    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => response.url().includes(`${apiUrl}${API_ENDPOINTS.CREATE_ROLE}`)
      ),
      saveButton.click()
    ]);

    // Either 201 (created) or 409 (conflict) is fine - both mean the role exists
    expect(
      createResponse.status() === 201 || createResponse.status() === 409,
      `Unexpected response status: ${createResponse.status()}`
    ).toBeTruthy();

    // Only wait for dashboard refresh on successful creation
    if (createResponse.status() === 201) {
      await expect(page.getByTestId('loading-spinner')).toBeHidden();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }

    // Verify API efficiency
    const createCalls = apiTracker.getCallsByMethod('POST');
    expect(createCalls.length, 'Multiple create calls detected').toBe(1);
  });
}); 