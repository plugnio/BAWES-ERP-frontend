# Core Rules

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