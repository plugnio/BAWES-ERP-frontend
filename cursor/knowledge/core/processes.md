# Core Processes

## Test Driven Development (TDD)

### Process Steps
1. Write failing test first
2. Implement minimum code to pass
3. Run tests to verify failure
4. Implement full solution
5. Verify tests pass
6. Refactor if needed

### Validation
- Tests must exist before implementation
- Tests must fail initially
- Implementation must make tests pass
- No test deletion without reason

## Code Change Process

### Before Changes
1. Read cursor/knowledge docs
2. Check existing implementations
3. Verify current test coverage
4. Understand requirements

### During Changes
1. Follow TDD process
2. Keep existing tests
3. Fix linting errors
4. Wait for linting (5s min)
5. Verify no errors remain

### After Changes
1. Run all tests
2. Check e2e/debug-output/debug.json
3. Verify no regressions
4. Update documentation

## Implementation Process

### New Features
1. Check BAWES SDK first
2. Document missing features
3. Follow component template
4. Add proper handling:
   - Errors
   - Loading
   - Empty states
   - Types
   - Null checks

### API Integration
1. Use shared configuration
2. Handle all cases:
   - Token expiry
   - 401 errors
   - Loading states
   - Empty responses

### Component Addition
1. Initialize state properly
2. Add all required states
3. Include proper types
4. Clean up effects
5. Follow UI standards

## Documentation Process

### Knowledge Updates
1. Keep cursor/knowledge up to date
2. Document new patterns
3. Update requirements
4. Maintain examples

### Implementation Docs
1. Document API usage
2. Update component docs
3. Maintain type definitions
4. Keep examples current 