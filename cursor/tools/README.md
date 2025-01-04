# Cursor Tools

Development tools for working with the Cursor AI assistant.

## Validation

Tools for validating assistant behavior and ensuring it follows best practices.

### Assistant Validation

Located in `validation/`:
- `assistant-tracker.ts`: Tracks and analyzes assistant actions
- `validate.ts`: CLI tool to validate assistant behavior

Usage:
```bash
# Run validation on cursor debug log
node cursor/tools/validation/validate.ts path/to/cursor-debug.json
```

Validates:
1. Documentation is checked before changes
2. Tests are preserved
3. TDD process is followed
4. Linting errors are fixed

Exit codes:
- 0: All checks passed
- 1: One or more checks failed 