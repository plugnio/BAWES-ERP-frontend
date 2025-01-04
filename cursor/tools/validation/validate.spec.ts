import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowValidator } from './validate';
import { AssistantTracker } from './assistant-tracker';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock AssistantTracker
jest.mock('./assistant-tracker', () => {
  return {
    AssistantTracker: jest.fn().mockImplementation(() => ({
      recordAction: jest.fn(),
      recordKnowledgeRead: jest.fn(),
      recordTestAnalyzed: jest.fn(),
      recordValidation: jest.fn(),
      getStatus: jest.fn(),
      getToolCalls: jest.fn().mockReturnValue([]),
      getFileChanges: jest.fn().mockReturnValue([]),
      getActionSequence: jest.fn().mockReturnValue([]),
      verifyTestsPreserved: jest.fn().mockReturnValue(true),
      verifyTDDProcess: jest.fn().mockReturnValue(true),
      reset: jest.fn()
    }))
  };
});

describe('WorkflowValidator', () => {
  let validator: WorkflowValidator;
  let tracker: jest.Mocked<AssistantTracker>;
  let mockConfig: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock config file
    mockConfig = {
      workflow: {
        start_sequence: [
          {
            action: 'read_knowledge',
            paths: ['cursor/knowledge/domain/*.md']
          }
        ],
        change_sequence: [
          {
            action: 'write_test',
            validate: 'test_exists'
          }
        ]
      },
      validation: {
        required_checks: [
          {
            type: 'doc_check',
            paths: ['cursor/knowledge/domain/*.md']
          }
        ]
      }
    };

    (readFileSync as jest.Mock).mockImplementation((path: unknown) => {
      if (typeof path === 'string' && path.endsWith('assistant.json')) {
        return JSON.stringify(mockConfig);
      }
      throw new Error(`Unexpected file read: ${path}`);
    });

    tracker = new AssistantTracker() as jest.Mocked<AssistantTracker>;
    validator = new WorkflowValidator(tracker);
  });

  describe('validateStartSequence', () => {
    it('should fail if knowledge files not read', () => {
      tracker.getStatus.mockReturnValue({
        knowledgeRead: [],
        testsAnalyzed: [],
        currentState: {
          phase: 'knowledge',
          completedSteps: [],
          pendingSteps: ['read_knowledge']
        },
        validationResults: [],
        actions: []
      });
      tracker.getToolCalls.mockReturnValue([]);
      expect(validator.validateStartSequence()).toBe(false);
    });

    it('should pass when required knowledge files are read', () => {
      const mockToolCall = {
        type: 'tool_call' as const,
        timestamp: Date.now(),
        details: {
          tool: 'read_file',
          params: {
            relative_workspace_path: 'cursor/knowledge/domain/permissions.md'
          }
        }
      };
      tracker.getStatus.mockReturnValue({
        knowledgeRead: ['cursor/knowledge/domain/permissions.md'],
        testsAnalyzed: [],
        currentState: {
          phase: 'knowledge',
          completedSteps: ['read_knowledge'],
          pendingSteps: []
        },
        validationResults: [],
        actions: [mockToolCall]
      });
      tracker.getToolCalls.mockReturnValue([mockToolCall]);
      expect(validator.validateStartSequence()).toBe(true);
    });
  });

  describe('validateChangeSequence', () => {
    it('should fail if test not written before implementation', () => {
      tracker.getActionSequence.mockReturnValue(['implement_code']);
      expect(validator.validateChangeSequence()).toBe(false);
    });

    it('should pass when following TDD sequence', () => {
      tracker.getActionSequence.mockReturnValue(['write_test', 'implement_code']);
      expect(validator.validateChangeSequence()).toBe(true);
    });
  });

  describe('validateRequiredChecks', () => {
    it('should fail if documentation not checked', () => {
      tracker.getStatus.mockReturnValue({
        knowledgeRead: [],
        testsAnalyzed: [],
        currentState: {
          phase: 'knowledge',
          completedSteps: [],
          pendingSteps: ['read_knowledge']
        },
        validationResults: [],
        actions: []
      });
      tracker.getToolCalls.mockReturnValue([]);
      expect(validator.validateRequiredChecks()).toBe(false);
    });

    it('should fail if tests would be deleted', () => {
      const mockFileChange = {
        type: 'file_change' as const,
        timestamp: Date.now(),
        details: {
          file: 'src/test.spec.ts',
          content: '// Empty test file'
        }
      };
      tracker.getStatus.mockReturnValue({
        knowledgeRead: ['cursor/knowledge/domain/permissions.md'],
        testsAnalyzed: ['test.spec.ts'],
        currentState: {
          phase: 'implementation',
          completedSteps: ['read_knowledge', 'write_test'],
          pendingSteps: []
        },
        validationResults: [],
        actions: [mockFileChange]
      });
      tracker.getFileChanges.mockReturnValue([mockFileChange]);
      tracker.verifyTestsPreserved.mockReturnValue(false);
      expect(validator.validateRequiredChecks()).toBe(false);
    });

    it('should pass when all checks complete', () => {
      const mockToolCall = {
        type: 'tool_call' as const,
        timestamp: Date.now(),
        details: {
          tool: 'read_file',
          params: {
            relative_workspace_path: 'cursor/knowledge/domain/permissions.md'
          }
        }
      };
      tracker.getStatus.mockReturnValue({
        knowledgeRead: ['cursor/knowledge/domain/permissions.md'],
        testsAnalyzed: ['test.spec.ts'],
        currentState: {
          phase: 'implementation',
          completedSteps: ['read_knowledge', 'write_test'],
          pendingSteps: []
        },
        validationResults: [],
        actions: [mockToolCall]
      });
      tracker.getToolCalls.mockReturnValue([mockToolCall]);
      tracker.verifyTestsPreserved.mockReturnValue(true);
      tracker.verifyTDDProcess.mockReturnValue(true);
      expect(validator.validateRequiredChecks()).toBe(true);
    });
  });
}); 