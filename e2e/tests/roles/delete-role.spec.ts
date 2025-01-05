import { test } from '../../fixtures/auth.fixture';
import { expect, type Response } from '@playwright/test';
import { loadTestEnv } from '../../config/env';
import { ROUTES } from '../constants';
import type { PermissionsService } from '../../../src/services/permissions.service';

declare global {
  interface Window {
    permissionsService?: PermissionsService;
  }
}

test.describe('Role Deletion', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const env = loadTestEnv();
    
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for initial roles to load
    await page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/permissions/dashboard`) && 
      response.request().method() === 'GET'
    );
  });

  test('can delete a non-system role', async ({ authenticatedPage: page }) => {
    const env = loadTestEnv();
    
    // Generate unique role name using timestamp
    const timestamp = Date.now();
    const roleName = `Test Role ${timestamp}`;
    
    // Get initial role count
    const initialCount = await page.getByTestId('role-item').count();
    
    // Create a new role for testing
    await page.getByRole('button', { name: 'New Role' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Fill in role details
    await page.getByLabel('Role Name').fill(roleName);
    
    // Set up response promises before clicking save
    const createPromise = page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/roles`) && 
      response.request().method() === 'POST'
    );
    
    // Click save and wait for role creation
    await page.getByRole('button', { name: 'Save' }).click();
    const createResponse = await createPromise;
    const roleData = await createResponse.json();
    expect(createResponse.status()).toBe(201);
    await expect(dialog).not.toBeVisible();
    
    // Wait for role to appear in the list and be fully loaded
    await expect(page.getByText(roleName)).toBeVisible();
    
    // Verify role was added
    await expect(async () => {
      const roleItems = page.getByTestId('role-item');
      const count = await roleItems.count();
      expect(count).toBe(initialCount + 1);
    }).toPass({ timeout: 15000 });

    // Wait for network to be idle before proceeding
    await page.waitForLoadState('networkidle');

    // Find and wait for the role item to be visible and interactive
    const roleItem = page.getByTestId('role-item').filter({ hasText: roleName });
    await expect(roleItem).toBeVisible();
    await expect(roleItem.getByTestId('delete-role-button')).toBeVisible();

    // Set up response promises before clicking delete
    const deletePromise = page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/roles/${roleData.id}`) && 
      response.request().method() === 'DELETE'
    );

    const dashboardRefreshPromise = page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/permissions/dashboard`) && 
      response.request().method() === 'GET'
    );

    // Click the delete button
    await roleItem.getByTestId('delete-role-button').click();

    // Click confirm in the alert dialog
    await page.getByRole('button', { name: 'Delete' }).click();
    
    // Wait for delete response
    const deleteResponse = await deletePromise;
    expect(deleteResponse.status()).toBe(200);

    // Wait for dashboard refresh
    await dashboardRefreshPromise;

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    // Wait for role to be removed from the list with retries
    await expect(async () => {
      await expect(page.getByText(roleName)).not.toBeVisible();
      const roleItems = page.getByTestId('role-item');
      const count = await roleItems.count();
      expect(count).toBe(initialCount);
    }).toPass({ timeout: 15000 });
  });

  test('cannot delete system roles', async ({ authenticatedPage: page }) => {
    // Find a system role
    const systemRoleItem = page.getByTestId('role-item').filter({ hasText: 'System Admin' }).first();
    await expect(systemRoleItem).toBeVisible();

    // Verify delete button is not present for system roles
    await expect(systemRoleItem.getByTestId('delete-role-button')).not.toBeVisible();
  });
}); 