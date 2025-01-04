# Cursor Assistant Configuration

Configuration for automated assistant behavior and validation.

## Structure

### Workflow
Controls the sequence of actions:
```json
"workflow": {
  "start_sequence": [],  // Required steps before changes
  "change_sequence": []  // Required steps during changes
}
```

### Validation
Defines required checks:
```json
"validation": {
  "required_checks": [], // Must pass before completion
  "auto_fixes": {}      // What can be auto-fixed
}
```

### Tools
Tool usage configuration:
```json
"tools": {
  "search": {},  // Search tool preferences
  "file": {},    // File tool requirements
  "terminal": {} // Terminal tool settings
}
```

### Debug
Debug and logging settings:
```json
"debug": {
  "paths": {},       // Important file paths
  "requirements": {} // Verification requirements
}
```

## Usage

1. Assistant automatically follows this configuration
2. Validation tools verify compliance
3. Fine-tuning can be done by modifying:
   - Workflow sequences
   - Required checks
   - Tool preferences
   - Debug requirements

## Fine-tuning

To adjust assistant behavior:

1. Modify workflow:
```json
"workflow": {
  "start_sequence": [
    {
      "action": "read_knowledge",
      "paths": ["new/path/*.md"]
    }
  ]
}
```

2. Add required checks:
```json
"validation": {
  "required_checks": [
    {
      "type": "new_check",
      "config": {}
    }
  ]
}
```

3. Update tool preferences:
```json
"tools": {
  "search": {
    "new_preference": true
  }
}
``` 