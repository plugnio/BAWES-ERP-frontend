# Testing Infrastructure

## Test Types

### E2E Tests
- Location: `e2e/tests/**/*.spec.ts`
- Framework: Playwright
- Config: `e2e/config/playwright.config.ts`
- Debug Output: `e2e/debug-output/debug.json`
- Purpose: Full user flow testing
- Fixtures: `e2e/fixtures/`

### Unit Tests
- Location: `src/**/*.spec.ts`
- Framework: Jest
- Purpose: Test individual components/services
- Mocks: Use Jest mocks for dependencies
- Coverage: Required for all new code

## Test Commands

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run with debugger
npm run test:e2e:debug

# Run specific tests
npm run test:e2e:ui tests/roles/list-roles.spec.ts
```

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

## Test Files

### E2E Test Structure
```typescript
import { test } from '../../fixtures/auth.fixture';
import { expect } from '@playwright/test';
import { trackApiCalls } from '../../utils/api-tracker';

test.describe('Feature', () => {
  test('user flow', async ({ page }) => {
    const apiTracker = trackApiCalls(page);
    
    // Test steps
    await page.goto('/path');
    await page.click('text=Button');
    
    // Verify API optimization
    const calls = apiTracker.getCalls();
    expect(calls.length).toBe(1); // Check efficient API usage
  });
});
```

### Unit Test Structure
```typescript
import { describe, it, expect, jest } from '@jest/globals';

describe('Component/Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

## Testing Focus Areas

### Feature Tests with API Optimization
Each feature test should include:
- Functional requirements verification
- API call optimization checks
- Response caching validation
- Performance monitoring

### Unit Tests
1. Mock external dependencies
2. Test edge cases
3. Verify error handling
4. Check state changes
5. Test async behavior

## Debug Output

### E2E Debug File
- Location: `e2e/debug-output/debug.json`
- Contains:
  - Test execution logs
  - Network requests
  - Console output
  - Screenshots
  - Test results

### Test Reports
- Location: `test-results/`
- Contains:
  - Test run logs
  - Failure screenshots
  - Trace files
  - Performance data 