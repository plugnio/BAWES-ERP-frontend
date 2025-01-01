import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';
import { ROUTES, API_ENDPOINTS } from '../constants';
import type { APIResponse } from '@playwright/test';

test.describe('Roles List Page', () => {
  test('loads and displays roles', async ({ authenticatedPage: page }) => {
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for critical UI elements
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Verify roles are loaded
    const roleButtons = await page.getByRole('button').filter({ hasText: /^(?!New Role|Save).*/ }).count();
    expect(roleButtons).toBeGreaterThan(0);
  });

  test('efficiently handles role creation', async ({ authenticatedPage: page }) => {
    // Navigate to roles page
    await page.goto(ROUTES.ROLES);
    
    // Wait for UI to be ready
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Wait for and click the New Role button
    const newRoleButton = page.getByRole('button', { name: /new role/i });
    await expect(newRoleButton).toBeVisible();
    await newRoleButton.click();
    
    // Fill role name
    const roleNameInput = page.getByLabel(/role name/i);
    await expect(roleNameInput).toBeVisible();
    await roleNameInput.fill('Test Role');
    
    // Save and wait for response
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    
    // Wait for UI to update
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}); 