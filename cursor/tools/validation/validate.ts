import { readFileSync } from 'fs';
import { join } from 'path';
import { AssistantTracker, ValidationState, AssistantAction } from './assistant-tracker';

interface WorkflowConfig {
  start_sequence: {
    action: string;
    paths?: string[];
    tools?: string[];
  }[];
  change_sequence: {
    action: string;
    validate?: string;
    steps?: string[];
  }[];
}

interface ValidationConfig {
  required_checks: {
    type: string;
    paths?: string[];
    patterns?: string[];
    sequence?: string[];
    wait_time?: number;
  }[];
}

export class WorkflowValidator {
  private readonly config: {
    workflow: WorkflowConfig;
    validation: ValidationConfig;
  };

  constructor(private readonly tracker: AssistantTracker) {
    const configPath = join(process.cwd(), 'cursor/config/assistant.json');
    this.config = JSON.parse(readFileSync(configPath, 'utf8'));
  }

  // Validate start sequence is followed
  validateStartSequence(): boolean {
    const status = this.tracker.getStatus();
    if (!status) {
      this.tracker.recordValidation(false, ['No status available']);
      return false;
    }

    const sequence = this.config.workflow.start_sequence;

    // Check each required step
    for (const step of sequence) {
      switch (step.action) {
        case 'read_knowledge':
          // Verify knowledge files are read
          if (step.paths) {
            const hasReadAll = step.paths.every(pattern => {
              const hasMatchingFile = status.knowledgeRead.some(file => 
                this.matchPattern(file, pattern)
              );
              const hasMatchingToolCall = this.tracker.getToolCalls().some(call => 
                call.details.tool === 'read_file' && 
                call.details.params?.relative_workspace_path && 
                this.matchPattern(call.details.params.relative_workspace_path.toString(), pattern)
              );
              return hasMatchingFile && hasMatchingToolCall;
            });
            if (!hasReadAll) {
              this.tracker.recordValidation(false, ['Not all required knowledge files read']);
              return false;
            }
          }
          break;

        case 'check_implementation':
          // Verify implementation check tools were used
          if (step.tools) {
            const hasUsedAll = step.tools.every(tool =>
              this.tracker.getToolCalls().some(call => call.details.tool === tool)
            );
            if (!hasUsedAll) {
              this.tracker.recordValidation(false, ['Not all implementation checks completed']);
              return false;
            }
          }
          break;

        case 'understand_tests':
          // Verify test files were analyzed
          if (step.paths) {
            const hasAnalyzedAll = step.paths.every(pattern =>
              status.testsAnalyzed.some(file => this.matchPattern(file, pattern))
            );
            if (!hasAnalyzedAll) {
              this.tracker.recordValidation(false, ['Not all test files analyzed']);
              return false;
            }
          }
          break;
      }
    }

    this.tracker.recordValidation(true);
    return true;
  }

  // Validate change sequence is followed
  validateChangeSequence(): boolean {
    const actions = this.tracker.getActionSequence();
    if (!actions) {
      this.tracker.recordValidation(false, ['No actions available']);
      return false;
    }

    const sequence = this.config.workflow.change_sequence;

    // Check sequence order
    let lastIndex = -1;
    for (const step of sequence) {
      const currentIndex = actions.findIndex(a => a === step.action);
      if (currentIndex === -1) {
        this.tracker.recordValidation(false, [`Missing required step: ${step.action}`]);
        return false;
      }
      if (currentIndex < lastIndex) {
        this.tracker.recordValidation(false, [`Invalid step order: ${step.action}`]);
        return false;
      }
      lastIndex = currentIndex;
    }

    this.tracker.recordValidation(true);
    return true;
  }

  // Validate required checks are performed
  validateRequiredChecks(): boolean {
    const status = this.tracker.getStatus();
    if (!status) {
      this.tracker.recordValidation(false, ['No status available']);
      return false;
    }

    const checks = this.config.validation.required_checks;

    for (const check of checks) {
      switch (check.type) {
        case 'doc_check':
          if (!this.validateDocCheck(check.paths || [])) {
            return false;
          }
          break;

        case 'test_preservation':
          if (!this.validateTestPreservation(check.patterns || [])) {
            return false;
          }
          break;

        case 'tdd_process':
          if (!this.validateTDDProcess(check.sequence || [])) {
            return false;
          }
          break;

        case 'linting':
          if (!this.validateLinting(check.wait_time || 5000)) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  private validateDocCheck(paths: string[]): boolean {
    const status = this.tracker.getStatus();
    if (!status) {
      this.tracker.recordValidation(false, ['No status available']);
      return false;
    }

    const hasReadAll = paths.every(pattern => {
      const hasMatchingFile = status.knowledgeRead.some(file => 
        this.matchPattern(file, pattern)
      );
      const hasMatchingToolCall = this.tracker.getToolCalls().some(call => 
        call.details.tool === 'read_file' && 
        call.details.params?.relative_workspace_path && 
        this.matchPattern(call.details.params.relative_workspace_path.toString(), pattern)
      );
      return hasMatchingFile && hasMatchingToolCall;
    });
    if (!hasReadAll) {
      this.tracker.recordValidation(false, ['Documentation check failed']);
      return false;
    }
    return true;
  }

  private validateTestPreservation(patterns: string[]): boolean {
    const fileChanges = this.tracker.getFileChanges();
    if (!fileChanges) {
      this.tracker.recordValidation(false, ['No file changes available']);
      return false;
    }
    
    for (const change of fileChanges) {
      if (!change.details.file) continue;
      
      // Check if file matches test patterns
      if (patterns.some(pattern => this.matchPattern(change.details.file || '', pattern))) {
        // Get original content
        const originalContent = readFileSync(change.details.file, 'utf8');
        const newContent = change.details.content || '';
        
        if (!this.tracker.verifyTestsPreserved(originalContent, newContent)) {
          this.tracker.recordValidation(false, ['Test cases were deleted or modified']);
          return false;
        }
      }
    }
    return true;
  }

  private validateTDDProcess(sequence: string[]): boolean {
    return this.tracker.verifyTDDProcess();
  }

  private validateLinting(waitTime: number): boolean {
    // Implementation would verify linting was run with proper wait time
    return true;
  }

  private matchPattern(value: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regexPattern).test(value);
  }

  // Reset validation state
  reset(): void {
    this.tracker.reset();
  }
} 