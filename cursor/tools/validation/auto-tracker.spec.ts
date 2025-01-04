import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AutoTracker } from './auto-tracker';
import { AssistantTracker } from './assistant-tracker';

// Mock AssistantTracker
jest.mock('./assistant-tracker');

describe('AutoTracker', () => {
  let autoTracker: AutoTracker;
  let mockAssistantTracker: jest.Mocked<AssistantTracker>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAssistantTracker = new AssistantTracker() as jest.Mocked<AssistantTracker>;
    autoTracker = new AutoTracker(mockAssistantTracker);
  });

  describe('trackToolCall', () => {
    it('should record tool call and update state', () => {
      // When
      autoTracker.trackToolCall('read_file', {
        relative_workspace_path: 'cursor/knowledge/core/rules.md'
      });

      // Then
      expect(mockAssistantTracker.recordAction).toHaveBeenCalledWith({
        type: 'tool_call',
        timestamp: expect.any(Number),
        details: {
          tool: 'read_file',
          params: {
            relative_workspace_path: 'cursor/knowledge/core/rules.md'
          }
        }
      });

      // And should record knowledge read for docs
      expect(mockAssistantTracker.recordKnowledgeRead)
        .toHaveBeenCalledWith('cursor/knowledge/core/rules.md');
    });

    it('should record test analysis for test files', () => {
      // When
      autoTracker.trackToolCall('read_file', {
        relative_workspace_path: 'src/test.spec.ts'
      });

      // Then
      expect(mockAssistantTracker.recordTestAnalyzed)
        .toHaveBeenCalledWith('src/test.spec.ts');
    });
  });

  describe('validateWorkflow', () => {
    it('should fail if start sequence not complete', () => {
      // Given
      mockAssistantTracker.getStatus.mockReturnValue({
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

      // When
      const result = autoTracker.validateWorkflow();

      // Then
      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Start sequence not complete');
    });

    it('should fail if trying to implement before tests', () => {
      // Given
      mockAssistantTracker.getStatus.mockReturnValue({
        knowledgeRead: ['docs/rules.md'],
        testsAnalyzed: [],
        currentState: {
          phase: 'implementation',
          completedSteps: ['read_knowledge'],
          pendingSteps: []
        },
        validationResults: [],
        actions: []
      });

      // When
      const result = autoTracker.validateWorkflow();

      // Then
      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Must write tests before implementation');
    });

    it('should pass when following workflow', () => {
      // Given
      mockAssistantTracker.getStatus.mockReturnValue({
        knowledgeRead: ['docs/rules.md'],
        testsAnalyzed: ['test.spec.ts'],
        currentState: {
          phase: 'implementation',
          completedSteps: ['read_knowledge', 'write_test'],
          pendingSteps: []
        },
        validationResults: [],
        actions: [
          {
            type: 'tool_call',
            timestamp: Date.now(),
            details: {
              tool: 'read_file',
              params: { relative_workspace_path: 'docs/rules.md' }
            }
          },
          {
            type: 'tool_call',
            timestamp: Date.now(),
            details: {
              tool: 'edit_file',
              params: { target_file: 'test.spec.ts' }
            }
          }
        ]
      });

      // When
      const result = autoTracker.validateWorkflow();

      // Then
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
}); 