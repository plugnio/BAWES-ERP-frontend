import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface AssistantAction {
  type: 'tool_call' | 'file_change' | 'test_action';
  timestamp: number;
  details: {
    tool?: string;
    params?: Record<string, any>;
    file?: string;
    content?: string;
    action?: string;
  };
}

export class AssistantTracker {
  private actions: AssistantAction[] = [];
  private debugLogPath: string;

  constructor(debugLogPath: string) {
    this.debugLogPath = debugLogPath;
    this.loadDebugLog();
  }

  private loadDebugLog() {
    try {
      const debugLog = JSON.parse(readFileSync(this.debugLogPath, 'utf8'));
      // Parse debug log and extract actions
      this.parseDebugLog(debugLog);
    } catch (error) {
      console.error('Failed to load debug log:', error);
    }
  }

  private parseDebugLog(log: any) {
    // Parse tool calls
    if (log.tool_calls) {
      for (const call of log.tool_calls) {
        this.actions.push({
          type: 'tool_call',
          timestamp: call.timestamp,
          details: {
            tool: call.name,
            params: call.params
          }
        });
      }
    }

    // Parse file changes
    if (log.file_changes) {
      for (const change of log.file_changes) {
        this.actions.push({
          type: 'file_change',
          timestamp: change.timestamp,
          details: {
            file: change.file,
            content: change.content
          }
        });
      }
    }
  }

  public getToolCalls(): AssistantAction[] {
    return this.actions.filter(a => a.type === 'tool_call');
  }

  public getFileChanges(): AssistantAction[] {
    return this.actions.filter(a => a.type === 'file_change');
  }

  public getActionSequence(): string[] {
    return this.actions.map(a => {
      if (a.type === 'tool_call') return a.details.tool || '';
      if (a.type === 'file_change') return 'file_change';
      return a.details.action || '';
    });
  }

  public verifyDocCheck(): boolean {
    const firstCall = this.actions[0];
    return (
      firstCall?.type === 'tool_call' &&
      firstCall.details.tool === 'read_file' &&
      firstCall.details.params?.relative_workspace_path?.includes('docs/cursor-knowledge.md')
    );
  }

  public verifyTestsPreserved(beforeFile: string, afterFile: string): boolean {
    const beforeTests = this.extractTestCases(beforeFile);
    const afterTests = this.extractTestCases(afterFile);

    return beforeTests.every(test => 
      afterTests.some(t => 
        t.name === test.name && 
        t.content === test.content
      )
    );
  }

  public verifyTDDProcess(): boolean {
    const sequence = this.getActionSequence();
    return (
      sequence.includes('write_test') &&
      sequence.indexOf('write_test') < sequence.indexOf('implement_code') &&
      sequence.indexOf('implement_code') < sequence.indexOf('verify_test')
    );
  }

  private extractTestCases(content: string): Array<{name: string, content: string}> {
    const tests: Array<{name: string, content: string}> = [];
    // Implementation to extract test cases from file content
    // This would need to be implemented based on your test file format
    return tests;
  }
} 