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
    
    // Wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => response.url().includes(`${apiUrl}${API_ENDPOINTS.ROLES}`)
      ),
      page.goto(ROUTES.ROLES),
      page.waitForLoadState('networkidle')
    ]);
    
    expect(response.ok()).toBeTruthy();

    // Verify UI elements
    await expect(page.locator('h1')).toHaveText('Role Management');
    
    // Wait for loading spinner to disappear
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    
    // Wait for roles to load
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();
    await expect(page.getByText('Drag to reorder roles and click to manage permissions')).toBeVisible();
    
    const roleButtons = await page.getByRole('button').filter({ hasText: /^(?!New Role|Save).*/ }).count();
    expect(roleButtons).toBeGreaterThan(0);

    // Check API calls
    const rolesCalls = apiTracker.getCallsByEndpoint(API_ENDPOINTS.ROLES);
    expect(rolesCalls.length, 'Multiple calls to roles endpoint detected').toBe(1);

    // Verify caching on re-navigation
    await page.goto(ROUTES.DASHBOARD);
    await page.goto(ROUTES.ROLES);
    await page.waitForLoadState('networkidle');
    
    const newCalls = apiTracker.getCallsSince(rolesCalls.length);
    const newRolesCalls = newCalls.filter(call => 
      call.url.includes(`${apiUrl}${API_ENDPOINTS.ROLES}`)
    );
    
    expect(newRolesCalls.length, 'Should make one API call per page visit').toBe(1);
  });

  test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
    console.log('Starting role creation test');
    const apiTracker = trackApiCalls(page);
    const apiUrl = process.env.NEXT_PUBLIC_ERP_API_URL;
    if (!apiUrl) throw new Error('NEXT_PUBLIC_ERP_API_URL environment variable is not set');
    
    console.log('Navigating to roles page');
    // Navigate and wait for initial load in parallel
    await Promise.all([
      page.goto(ROUTES.ROLES),
      page.waitForResponse(
        (response: APIResponse) => response.url().includes(`${apiUrl}${API_ENDPOINTS.ROLES}`) && response.ok()
      ),
      expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible(),
      expect(page.getByTestId('loading-spinner')).toBeHidden()
    ]);
    console.log('Initial page load complete');

    // Clear previous calls before role creation
    apiTracker.clear();
    
    // Create new role - perform actions in parallel where possible
    console.log('Clicking new role button');
    const newRoleButton = page.getByRole('button', { name: /new role/i });
    await newRoleButton.click();
    
    // Wait for input and fill in parallel
    console.log('Filling role name');
    const roleNameInput = page.getByLabel(/role name/i);
    await Promise.all([
      expect(roleNameInput).toBeVisible(),
      roleNameInput.fill('Test Role')
    ]);
    
    // Click save and wait for POST response
    console.log('Clicking save button');
    const saveButton = page.getByRole('button', { name: /save/i });
    await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => 
          response.url().includes(`${apiUrl}${API_ENDPOINTS.CREATE_ROLE}`) && 
          response.ok()
      ),
      page.waitForResponse(
        (response: APIResponse) => 
          response.url().includes(`${apiUrl}${API_ENDPOINTS.ROLES}`) && 
          response.ok()
      ),
      saveButton.click()
    ]);
    console.log('Save complete');

    // Verify API efficiency
    const createCalls = apiTracker.getCallsByMethod('POST');
    expect(createCalls.length, 'Multiple create calls detected').toBe(1);
    console.log('Test complete');
  });
}); 