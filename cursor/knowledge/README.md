# Cursor Assistant Knowledge Base

Core knowledge and understanding required for the Cursor AI assistant to function correctly.

## Directory Structure

```
knowledge/
  core/              # Core system understanding
    architecture.md  # System architecture and design decisions
    processes.md     # Required processes and workflows
    rules.md        # Rules and constraints
  
  domain/           # Domain-specific knowledge
    permissions.md  # Permission system understanding
    testing.md     # Testing requirements and patterns
    sdk.md         # SDK usage and integration
    
  implementation/   # Implementation details
    patterns.md    # Common implementation patterns
    components.md  # Component structure and usage
    api.md        # API integration details
```

## Usage

The assistant must:
1. Read and understand these docs before making changes
2. Follow all defined processes and rules
3. Keep knowledge up to date
4. Reference specific docs when making decisions

## Validation

Knowledge usage is validated by:
1. `cursor/tools/validation/assistant-tracker.ts`
2. Checking doc references in tool calls
3. Verifying process adherence
4. Monitoring implementation patterns 