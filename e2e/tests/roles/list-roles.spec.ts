import { test } from '../../fixtures/auth.fixture';
import { expect, Response } from '@playwright/test';
import { ROUTES } from '../constants';
import { loadTestEnv } from '../../config/env';

test.describe('Roles List Page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const env = loadTestEnv();
    
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial roles to load
    await page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/permissions/dashboard`) && 
      response.request().method() === 'GET'
    );
  });

  test('loads and displays roles', async ({ authenticatedPage: page }) => {
    // Wait for roles to be loaded
    const roleItems = page.getByTestId('role-item');
    await expect(roleItems.first()).toBeVisible();
    
    // Verify multiple roles exist
    const count = await roleItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('can create a new role', async ({ authenticatedPage: page }) => {
    const env = loadTestEnv();
    
    // Generate unique role name using timestamp
    const timestamp = Date.now();
    const roleName = `Test Role ${timestamp}`;
    const roleDescription = `Test role description ${timestamp}`;
    
    // Get initial role count
    const initialCount = await page.getByTestId('role-item').count();
    
    // Click New Role button and wait for dialog
    await page.getByRole('button', { name: 'New Role' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Fill in role details
    await page.getByLabel('Role Name').fill(roleName);
    await page.getByLabel('Description').fill(roleDescription);
    
    // Click save and wait for API response
    const [createResponse] = await Promise.all([
      page.waitForResponse((response: Response) => 
        response.url().includes(`${env.apiUrl}/roles`) && 
        response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Save' }).click()
    ]);
    
    // Get response data to verify
    const responseData = await createResponse.json();
    expect(createResponse.status()).toBe(201);
    expect(responseData.name).toBe(roleName);
    expect(responseData.description).toBe(roleDescription);
    expect(responseData.permissions).toEqual([]);
    
    // Wait for dialog to close
    await expect(dialog).not.toBeVisible();
    
    // Wait for role list to update and verify new role appears
    await expect(async () => {
      const count = await page.getByTestId('role-item').count();
      expect(count).toBe(initialCount + 1);
      await expect(page.getByText(roleName)).toBeVisible();
      await expect(page.getByText(roleDescription)).toBeVisible();
    }).toPass({ timeout: 30000 });
  });

  test('can update role permissions', async ({ authenticatedPage: page }) => {
    const env = loadTestEnv();
    
    // Wait for first role item to be visible
    await expect(page.getByTestId('role-item').first()).toBeVisible();
    
    // Click first non-system role (index 1)
    await page.getByTestId('role-item').nth(1).click();
    
    // Wait for permission dashboard and toggle
    await expect(page.getByTestId('permission-dashboard')).toBeVisible();
    const toggle = page.getByTestId('permission-toggle').first();
    await expect(toggle).toBeVisible();
    
    // Get current permissions before toggle
    const currentPermissions = await page.evaluate(() => {
      const toggles = Array.from(document.querySelectorAll('[data-testid="permission-toggle"]'));
      return toggles.map(toggle => ({
        id: toggle.getAttribute('data-permission-id'),
        checked: (toggle as HTMLInputElement).checked
      }));
    });
    
    // Get the role ID from the URL
    const roleId = page.url().split('/').pop();
    
    // Click toggle and wait for API response
    const [updateResponse] = await Promise.all([
      page.waitForResponse((response: Response) => 
        response.url().includes(`${env.apiUrl}/roles/${roleId}/permissions`) && 
        response.request().method() === 'PATCH'
      ),
      toggle.click()
    ]);
    
    // Wait for dashboard to refresh
    await page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/permissions/dashboard`) && 
      response.request().method() === 'GET'
    );
    
    // Get updated permissions after toggle
    const updatedPermissions = await page.evaluate(() => {
      const toggles = Array.from(document.querySelectorAll('[data-testid="permission-toggle"]'));
      return toggles.map(toggle => ({
        id: toggle.getAttribute('data-permission-id'),
        checked: (toggle as HTMLInputElement).checked
      }));
    });
    
    // Verify response and state
    expect(updateResponse.status()).toBe(200);
    expect(updatedPermissions[0].checked).not.toBe(currentPermissions[0].checked);
  });
}); 