# End-to-End Testing Guide

## Overview
This guide outlines the approach for E2E testing of the BAWES ERP frontend using Playwright, focusing on feature testing with integrated API optimization checks.

## Project Setup

### Installation
```bash
# Install Playwright
npm install -D @playwright/test

# Install browser binaries
npx playwright install
```

### Folder Structure
```
e2e/
├── config/
│   ├── playwright.config.ts     # Main playwright config
│   └── test-setup.ts           # Global test setup, helpers
├── fixtures/
│   ├── auth.fixture.ts         # Authentication helpers
│   └── test-data.fixture.ts    # Test data management
├── utils/
│   ├── api-tracker.ts          # API monitoring utilities
│   └── test-helpers.ts         # Common test utilities
├── tests/
│   ├── roles/
│   │   ├── create-role.spec.ts
│   │   ├── edit-role.spec.ts
│   │   └── list-roles.spec.ts
│   ├── permissions/
│   │   ├── assign-permissions.spec.ts
│   │   └── revoke-permissions.spec.ts
│   └── auth/
│       ├── login.spec.ts
│       └── logout.spec.ts
└── types/
    └── test.d.ts              # Test-specific type definitions
```

### Configuration
```typescript
// e2e/config/playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: '../tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
  ],
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
}

export default config
```

## Test Utilities

### API Tracker
```typescript
// e2e/utils/api-tracker.ts
export class ApiTracker {
  private calls: ApiCall[] = [];

  constructor(page) {
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        this.calls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });
  }

  getCalls() {
    return this.calls;
  }

  getCallsSince(index: number) {
    return this.calls.slice(index);
  }

  getEndpointCounts() {
    return this.calls.reduce((acc, call) => {
      acc[call.url] = (acc[call.url] || 0) + 1;
      return acc;
    }, {});
  }

  getCallsByMethod(method: string) {
    return this.calls.filter(call => call.method === method);
  }
}

export const trackApiCalls = (page) => new ApiTracker(page);
```

### Authentication Fixture
```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});
```

## Example Tests

### Role Management Tests
```typescript
// e2e/tests/roles/list-roles.spec.ts
import { test, expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';

test.describe('Roles List Page', () => {
  test('loads and displays roles efficiently', async ({ page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate and wait for initial load
    await page.goto('/roles');
    await page.waitForLoadState('networkidle');

    // Functional test - verify roles are displayed
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount.greaterThan(0);

    // API optimization checks
    const apiCalls = apiTracker.getCalls();
    const endpointCounts = apiTracker.getEndpointCounts();
    
    // Verify no duplicate calls
    for (const [endpoint, count] of Object.entries(endpointCounts)) {
      expect(count, `Endpoint ${endpoint} called multiple times`).toBe(1);
    }

    // Verify caching
    await page.goto('/dashboard');
    await page.goto('/roles');
    await page.waitForLoadState('networkidle');
    
    const newCalls = apiTracker.getCallsSince(apiCalls.length);
    expect(newCalls.length, 'Additional API calls made on revisit').toBe(0);
  });
});
```

### Permission Management Tests
```typescript
// e2e/tests/permissions/assign-permissions.spec.ts
import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';

test.describe('Permission Assignment', () => {
  test('assigns multiple permissions efficiently', async ({ authenticatedPage: page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Navigate to role edit
    await page.goto('/roles');
    await page.click('text=Edit Role');
    await page.waitForLoadState('networkidle');
    
    // Track initial state
    const initialCalls = apiTracker.getCalls().length;
    
    // Assign permissions
    await page.check('text=View Users');
    await page.check('text=Edit Users');
    await page.click('button:text("Save")');
    
    // Verify efficient API usage
    const newCalls = apiTracker.getCallsSince(initialCalls);
    expect(newCalls.length).toBe(1); // Should batch permission updates
    
    // Verify UI updates
    await expect(page.locator('text="Changes saved"')).toBeVisible();
  });
});
```

## Best Practices

### Writing Tests
1. Group related tests in feature directories
2. Include API optimization checks in feature tests
3. Use page objects for complex pages
4. Keep tests independent
5. Clean up test data

### API Optimization Checks
1. Track API calls for each test
2. Verify no duplicate calls
3. Check response caching
4. Validate batch operations
5. Monitor performance

### Test Organization
1. Use descriptive test names
2. Group related assertions
3. Add comments for complex flows
4. Use fixtures for common setup

## Running Tests

### NPM Scripts
```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:roles": "playwright test tests/roles/"
}
```

### Debug Mode
```bash
# Run specific test with UI
npm run test:e2e:ui tests/roles/list-roles.spec.ts

# Debug specific test
npm run test:e2e:debug tests/roles/list-roles.spec.ts
```

## CI Integration
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: |
            playwright-report/
            test-results/
``` 