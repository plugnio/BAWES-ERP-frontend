import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { ROUTES } from '../constants';

test.describe('Roles List Page', () => {
  test('loads and displays roles', async ({ authenticatedPage: page }) => {
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for heading to be visible
    await expect(page.getByRole('heading', { name: 'Role Management', level: 1 })).toBeVisible();
    
    // Wait for loading spinner to disappear
    await expect(page.getByRole('progressbar')).toBeHidden();
    
    // Wait for roles to be loaded
    const roleButtons = page.locator('button.w-full.justify-start.group');
    await expect(roleButtons.first()).toBeVisible();
    
    // Verify multiple roles exist
    const count = await roleButtons.count();
    expect(count).toBeGreaterThan(1);
  });

  test('can create a new role', async ({ authenticatedPage: page }) => {
    // Generate unique role name using timestamp
    const timestamp = Date.now();
    const roleName = `Test Role ${timestamp}`;
    const roleDescription = `Test role description ${timestamp}`;
    
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for heading to be visible
    await expect(page.getByRole('heading', { name: 'Role Management', level: 1 })).toBeVisible();
    
    // Wait for loading spinner to disappear
    await expect(page.getByRole('progressbar')).toBeHidden();
    
    // Click create role button
    await page.getByRole('button', { name: 'New Role' }).click();
    
    // Wait for dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill in role details
    await page.getByLabel('Role Name').fill(roleName);
    await page.getByLabel('Description').fill(roleDescription);
    
    // Submit form
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Wait for loading spinner to disappear again
    await expect(page.getByRole('progressbar')).toBeHidden();
    
    // Verify new role appears in list
    const newRole = page.getByText(roleName);
    await expect(newRole).toBeVisible();
    
    // Verify description is visible
    await expect(page.getByText(roleDescription)).toBeVisible();
  });
}); 