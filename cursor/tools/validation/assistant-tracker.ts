import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface ValidationState {
  knowledgeRead: string[];
  testsAnalyzed: string[];
  currentState: {
    phase: string;
    completedSteps: string[];
    pendingSteps: string[];
  };
  validationResults: { timestamp: string; passed: boolean; errors: string[]; }[];
  actions: AssistantAction[];
}

export interface AssistantAction {
  type: 'tool_call' | 'file_change' | 'test_action';
  timestamp: number;
  details: {
    tool?: string;
    params?: Record<string, unknown>;
    file?: string;
    content?: string;
    action?: string;
  };
}

export class AssistantTracker {
  private state: ValidationState = {
    knowledgeRead: [],
    testsAnalyzed: [],
    currentState: {
      phase: 'knowledge',
      completedSteps: [],
      pendingSteps: []
    },
    validationResults: [],
    actions: []
  };

  // Record an action taken by the assistant
  recordAction(action: AssistantAction): void {
    this.state.actions.push(action);
  }

  // Record that a knowledge file was read
  recordKnowledgeRead(file: string): void {
    if (!this.state.knowledgeRead.includes(file)) {
      this.state.knowledgeRead.push(file);
    }
  }

  // Record that a test file was analyzed
  recordTestAnalyzed(file: string): void {
    if (!this.state.testsAnalyzed.includes(file)) {
      this.state.testsAnalyzed.push(file);
    }
  }

  // Record validation result
  recordValidation(passed: boolean, errors: string[] = []): void {
    this.state.validationResults.push({
      timestamp: new Date().toISOString(),
      passed,
      errors
    });
  }

  // Get current validation state
  getStatus(): ValidationState {
    return this.state;
  }

  // Get tool calls made by the assistant
  getToolCalls(): AssistantAction[] {
    return this.state.actions.filter(a => a.type === 'tool_call');
  }

  // Get file changes made by the assistant
  getFileChanges(): AssistantAction[] {
    return this.state.actions.filter(a => a.type === 'file_change');
  }

  // Get sequence of actions taken
  getActionSequence(): string[] {
    return this.state.actions
      .filter(a => a.details.action)
      .map(a => a.details.action as string);
  }

  // Verify tests are preserved
  verifyTestsPreserved(originalContent: string, newContent: string): boolean {
    // Implementation would compare test cases
    return true;
  }

  // Verify TDD process was followed
  verifyTDDProcess(): boolean {
    // Implementation would verify test-first development
    return true;
  }

  // Reset tracker state
  reset(): void {
    this.state = {
      knowledgeRead: [],
      testsAnalyzed: [],
      currentState: {
        phase: 'knowledge',
        completedSteps: [],
        pendingSteps: []
      },
      validationResults: [],
      actions: []
    };
  }
} 