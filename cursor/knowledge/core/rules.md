# Core Rules

## Workflow Rules

### Starting Any Task
1. Read knowledge docs first:
   ```bash
   # ALWAYS start by reading
   cursor/knowledge/domain/*.md    # Domain understanding
   cursor/knowledge/core/*.md      # Core rules & processes
   ```

2. Check existing implementation:
   ```bash
   # Use semantic search first
   codebase_search "relevant terms"
   
   # Then exact matches if needed
   grep_search "exact_symbol"
   ```

3. Understand test requirements:
   - Check `e2e/tests/` for similar features
   - Review unit tests in related `*.spec.ts` files
   - Note test patterns and assertions

### Making Changes

1. Test First:
   ```typescript
   // 1. Write failing test
   edit_file "path/to/test.spec.ts"
   
   // 2. Run test to verify failure
   run_terminal_cmd "npm test path/to/test.spec.ts"
   ```

2. Implement:
   ```typescript
   // 3. Write implementation
   edit_file "path/to/implementation.ts"
   
   // 4. Run tests to verify
   run_terminal_cmd "npm test path/to/test.spec.ts"
   ```

3. Validate:
   ```bash
   # 5. Wait for linting (minimum 5s)
   # 6. Check for errors
   # 7. Fix any issues
   ```

### E2E Testing

1. Before E2E Tests:
   ```bash
   # Clear debug output
   rm e2e/debug-output/debug.json
   ```

2. Run Tests:
   ```bash
   # Run specific test with UI
   run_terminal_cmd "npm run test:e2e:ui tests/path/to/test.spec.ts"
   ```

3. After Tests:
   ```bash
   # Check debug output
   read_file "e2e/debug-output/debug.json"
   
   # Verify API optimization
   grep_search "api-tracker.*getCalls"
   ```

### Validation Process

1. Run Assistant Validation:
   ```bash
   # Validate my behavior
   run_terminal_cmd "node cursor/tools/validation/validate.ts cursor-debug.json"
   ```

2. Check Results:
   - Verify doc checks
   - Confirm test preservation
   - Validate TDD process
   - Check linting completion

3. Fix Issues:
   - Address any validation failures
   - Re-run validation until passing
   - Document new patterns if needed

## Tool Usage Rules

### Before Using Tools
1. ALWAYS read cursor/knowledge first
2. Check existing implementations
3. Understand the full context
4. Don't make assumptions

### Search Tools
1. `codebase_search`:
   - Use for semantic code search
   - Reuse user's exact query when possible
   - Specify target directories when relevant
   - Use for understanding implementations

2. `grep_search`:
   - Use for exact text/pattern matches
   - Prefer over semantic search for known symbols
   - Use with file type filters when possible
   - More precise than semantic search

3. `file_search`:
   - Use for fuzzy file path matching
   - When partial path is known
   - Limited to 10 results
   - Make query more specific if needed

### File Tools
1. `read_file`:
   - Must gather COMPLETE context
   - Check if more lines needed
   - Note lines not shown
   - Call again if context insufficient

2. `edit_file`:
   - Never output code to user
   - Add all necessary imports
   - Use `// ... existing code ...` for unchanged code
   - Include sufficient context

3. `list_dir`:
   - Use for initial discovery
   - Before using more targeted tools
   - To understand file structure
   - For exploration

### Validation Tools
1. `cursor/tools/validation/validate.ts`:
   - Run after changes
   - Check validation results
   - Fix any failures
   - Verify process adherence

2. `cursor/tools/validation/assistant-tracker.ts`:
   - Tracks tool usage
   - Verifies documentation checks
   - Monitors test preservation
   - Validates TDD process

### Terminal Tools
1. `run_terminal_cmd`:
   - Add `| cat` for commands that use pager
   - Set `is_background` for long-running commands
   - No newlines in commands
   - Provide clear explanations

### Debug Tools
1. Debug Output:
   - Check e2e/debug-output/debug.json after tests
   - Verify tool call sequence
   - Check file changes
   - Monitor test execution

2. Linting:
   - Wait minimum 5 seconds
   - Check complete output
   - Fix all errors
   - Don't guess at fixes

3. Test Validation:
   - Verify test execution
   - Check coverage
   - Monitor test preservation
   - Validate TDD process

## General Rules
- DO NOT HARDCODE URLS AND PATHS IN THE CODEBASE. USE ENV VARIABLES.
- All token handling is from sdk/api.ts and the bawes sdk
- Use BAWES SDK to generate code and interact with the backend ERP API
- Validate to confirm no linting errors and keep fixing until correct
- When installing npm dependencies, check for existing installations
- When using shadcn, use "@shadcn/ui" not "npx shadcn-ui@latest"
- Don't modify env files unless necessary
- Utilize Shadcn UI for frontend
- Use Nextjs features and libraries as per best practices
- Use TailwindCSS for styling
- Use TypeScript for the codebase
- Use Zod for validation

## Process Rules
1. After running e2e tests:
   - Check e2e/debug-output/debug.json for complete test log
   - Verify all tests passed
   - Fix any failures before proceeding

2. Documentation:
   - ALWAYS check docs/cursor-knowledge.md first
   - Keep documentation up to date
   - Document new requirements in /docs/requirements.md

3. Test Driven Development:
   - Write tests before implementation
   - Confirm tests pass before delivery
   - Don't delete existing tests
   - Only delete code during planned refactoring

4. Code Changes:
   - Validate no linting errors
   - Wait for linting to complete (minimum 5 seconds)
   - Verify no errors remain
   - Only then share solution

## Component Rules

### When installing shadcn/ui components:
1. Check if component exists in src/components/ui
2. If not exists:
   - Use: npx @shadcn/ui add <component-name>
   - Select: src/components/ui
   - Style: default
   - Allow overwrite
3. Verify installation in src/components/ui
4. Use exact path: @/components/ui/<component>

### When implementing new features:
1. Check BAWES SDK first
2. Use shared SDK configuration
3. Follow component template
4. Add proper:
   - Error handling
   - Loading states
   - Empty states
   - Type definitions
   - Null checks

### When making API calls:
1. Use shared SDK configuration
2. Handle:
   - Token expiry
   - 401 errors
   - Error messages
   - Loading states
   - Empty responses

### When handling authentication:
1. Use shared SDK configuration
2. Handle:
   - Token expiry
   - Token refresh
   - 401 errors
3. Use debug panel for token state

### When adding components:
1. Initialize state properly
2. Add proper:
   - Loading states
   - Error states
   - Empty states
   - Type definitions
   - Null checks
3. Clean up effects with isMounted flag 