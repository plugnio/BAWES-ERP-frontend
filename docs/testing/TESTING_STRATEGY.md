# BAWES ERP Frontend Testing Strategy

## Overview
This document outlines the E2E testing strategy for the BAWES ERP frontend application, focusing on critical user journeys and API optimization within feature tests.

## Testing Stack

### End-to-End Testing
- **Playwright**: Primary E2E testing framework
  - Cross-browser testing (Chrome, Firefox, Safari)
  - Network request monitoring
  - Visual testing capabilities
  - Performance tracking

## Project Structure
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

## Testing Focus Areas

### Feature Tests with Integrated API Optimization
Each feature test should include:
- Functional requirements verification
- API call optimization checks
- Response caching validation
- Performance monitoring

### Core Business Flows
- **Location**: `e2e/tests/{feature}`
- **Coverage Areas**:
  - Role management
  - Permission management
  - User management
  - Authentication flows

## Testing Priorities

### Phase 1: Core Features
1. Roles Management
   - List roles with API optimization
   - Create role efficiently
   - Edit role with minimal API calls
   - Delete role validation

2. Permission Management
   - Permission assignment optimization
   - Role-permission relationship
   - Access control validation

3. Authentication
   - Login/Logout flows
   - Token handling
   - Session management

### Phase 2: Extended Features
1. User Management
   - User creation
   - Role assignment
   - Permission inheritance

2. Data Management
   - Batch operations
   - Data validation
   - Error handling

## Implementation Plan

### Phase 1: Setup
1. Configure Playwright
2. Set up test utilities
3. Create API tracking helpers
4. Implement authentication fixtures

### Phase 2: Core Tests
1. Implement role management tests
2. Add permission management tests
3. Create authentication tests

## Best Practices

### Test Organization
- Group tests by feature domain
- Include API optimization in each test
- Use descriptive test names
- Keep tests independent

### API Testing Guidelines
- Track API calls within feature tests
- Validate request efficiency
- Check response caching
- Monitor performance

## Tools & Scripts

### NPM Scripts
```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:roles": "playwright test tests/roles/"
}
```

### Example Test Structure
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

### CI Integration
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

## Maintenance
- Regular review of test coverage
- Update tests with feature changes
- Monitor performance metrics
- Keep dependencies updated 