import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';
import { ROUTES, API_ENDPOINTS } from '../constants';
import type { APIResponse, Request as PlaywrightRequest, Response as PlaywrightResponse } from '@playwright/test';

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
    
    // Click save and wait for create response first
    console.log('Clicking save button');
    const saveButton = page.getByRole('button', { name: /save/i });

    // Log all requests
    page.on('request', (request: PlaywrightRequest) => {
      console.log(`Request: ${request.method()} ${request.url()}`);
      if (request.url().includes(`${apiUrl}${API_ENDPOINTS.CREATE_ROLE}`)) {
        console.log('Request body:', request.postData());
      }
    });
    page.on('response', (response: PlaywrightResponse) => {
      console.log(`Response: ${response.status()} ${response.url()}`);
    });

    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (response: APIResponse) => {
          console.log(`Checking response: ${response.url()}`);
          return response.url().includes(`${apiUrl}${API_ENDPOINTS.CREATE_ROLE}`);
        }
      ),
      saveButton.click()
    ]);
    console.log(`Create role response received with status ${createResponse.status()}`);

    // Log error details if any
    if (!createResponse.ok()) {
      const errorBody = await createResponse.json().catch(() => 'Could not parse error response');
      console.error('Role creation failed:', errorBody);
    }

    // Verify the response was successful
    expect(createResponse.ok(), 'Role creation failed').toBeTruthy();

    // Then wait for dashboard refresh
    const dashboardResponse = await page.waitForResponse(
      (response: APIResponse) => {
        console.log(`Checking dashboard response: ${response.url()}`);
        return response.url().includes(`${apiUrl}${API_ENDPOINTS.ROLES}`) && response.ok();
      }
    );
    console.log('Dashboard refresh complete');

    // Verify API efficiency
    const createCalls = apiTracker.getCallsByMethod('POST');
    expect(createCalls.length, 'Multiple create calls detected').toBe(1);
    console.log('Test complete');
  });
}); 