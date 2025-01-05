import { test } from '../../fixtures/auth.fixture';
import { expect, Response } from '@playwright/test';
import { ROUTES } from '../constants';
import { loadTestEnv } from '../../config/env';

test.describe('Roles List Page', () => {
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
    
    // Set up response promises before clicking save
    const createPromise = page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/roles`) && 
      response.request().method() === 'POST'
    );
    
    // Click save
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Wait for create response and verify
    const createResponse = await createPromise;
    const responseData = await createResponse.json();
    expect(createResponse.status()).toBe(201);
    expect(responseData.name).toBe(roleName);
    expect(responseData.description).toBe(roleDescription);
    expect(responseData.permissions).toEqual([]);
    
    // Wait for dialog to close
    await expect(dialog).not.toBeVisible();
    
    // Wait for role to appear in the list with retries
    await expect(async () => {
      // Wait for role name to be visible first
      await expect(page.getByText(roleName)).toBeVisible();
      await expect(page.getByText(roleDescription)).toBeVisible();
      
      // Then check the count
      const roleItems = page.getByTestId('role-item');
      const count = await roleItems.count();
      expect(count).toBe(initialCount + 1);
    }).toPass({ timeout: 15000 }); // Match the global timeout
  });

  test('can update role permissions', async ({ authenticatedPage: page }) => {
    const env = loadTestEnv();
    
    // Create a new role for testing
    const timestamp = Date.now();
    const roleName = `Test Role ${timestamp}`;
    
    // Click New Role button and wait for dialog
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
    await createPromise;
    await expect(dialog).not.toBeVisible();
    
    // Wait for role to appear and click it
    await page.getByText(roleName).click();
    
    // Wait for permission dashboard to load
    await expect(page.getByTestId('permission-dashboard')).toBeVisible();
    
    // Get first category's first permission toggle
    const firstToggle = page.getByTestId('permission-toggle').first();
    await expect(firstToggle).toBeVisible();
    
    // Set up response promise for permission toggle
    const togglePromise = page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/roles`) && 
      response.url().includes('/permissions') &&
      response.request().method() === 'PATCH'
    );
    
    // Click toggle and wait for response
    await firstToggle.click();
    const toggleResponse = await togglePromise;
    expect(toggleResponse.status()).toBe(200);
    
    // Wait for dashboard refresh
    await page.waitForResponse((response: Response) => 
      response.url().includes(`${env.apiUrl}/permissions/dashboard`) && 
      response.request().method() === 'GET'
    );
    
    // Verify toggle state updated
    await expect(firstToggle).toBeChecked();
  });
}); 