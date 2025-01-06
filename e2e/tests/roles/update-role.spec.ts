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

test.describe('Role Update', () => {
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

  test('should update a role successfully', async ({ authenticatedPage: page }) => {
    // Wait for roles to load and be visible
    await page.waitForSelector('[data-testid="role-item"]', { state: 'visible' });
    await page.waitForTimeout(1000); // Wait for any animations to complete

    // Get all role items
    const roleItems = await page.getByTestId('role-item').all();
    expect(roleItems.length).toBeGreaterThan(0);

    // Find a non-system role to update (second role)
    const roleToUpdate = roleItems[1];
    expect(roleToUpdate).toBeDefined();

    // Find and click the edit button within the role item
    const editButtons = await page.locator('[data-testid="edit-role-button"]').all();
    expect(editButtons.length).toBeGreaterThan(0);
    await editButtons[0].click();

    // Wait for dialog to appear
    await page.waitForSelector('form');

    // Generate unique role name
    const timestamp = Date.now();
    const updatedName = `Updated Role ${timestamp}`;
    const updatedDescription = `Updated description ${timestamp}`;

    // Fill in form
    await page.getByPlaceholder('Enter role name').fill(updatedName);
    await page.getByPlaceholder('Enter role description').fill(updatedDescription);

    // Submit form
    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for success toast
    await page.waitForSelector('text=Role updated successfully');

    // Verify role was updated
    const updatedRole = await page.getByTestId('role-item').filter({ hasText: updatedName }).first();
    await expect(updatedRole).toBeVisible();
    await expect(updatedRole).toHaveText(new RegExp(updatedDescription));
  });

  test('should show error when updating role with empty name', async ({ authenticatedPage: page }) => {
    // Wait for roles to load and be visible
    await page.waitForSelector('[data-testid="role-item"]', { state: 'visible' });
    await page.waitForTimeout(1000); // Wait for any animations to complete

    // Get all role items
    const roleItems = await page.getByTestId('role-item').all();
    expect(roleItems.length).toBeGreaterThan(0);

    // Find a non-system role to update (second role)
    const roleToUpdate = roleItems[1];
    expect(roleToUpdate).toBeDefined();

    // Find and click the edit button within the role item
    const editButtons = await page.locator('[data-testid="edit-role-button"]').all();
    expect(editButtons.length).toBeGreaterThan(0);
    await editButtons[0].click();

    // Wait for dialog to appear
    await page.waitForSelector('form');

    // Clear name field
    await page.getByPlaceholder('Enter role name').fill('');

    // Submit form
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify error message
    await expect(page.getByText('Role name is required')).toBeVisible();
  });

  test('should not show edit button for system roles', async ({ authenticatedPage: page }) => {
    // Wait for roles to load and be visible
    await page.waitForSelector('[data-testid="role-item"]', { state: 'visible' });
    await page.waitForTimeout(1000); // Wait for any animations to complete

    // Get all role items
    const roleItems = await page.getByTestId('role-item').all();
    expect(roleItems.length).toBeGreaterThan(0);

    // Find system role (first role)
    const systemRole = roleItems[0];
    expect(systemRole).toBeDefined();

    // Verify system role has system badge
    await expect(systemRole.getByText('System')).toBeVisible();

    // Verify edit button is not present
    const editButton = systemRole.getByTestId('edit-role-button');
    await expect(editButton).toHaveCount(0);
  });
}); 