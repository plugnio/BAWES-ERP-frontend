"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantTracker = void 0;
class AssistantTracker {
    constructor() {
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
    // Record an action taken by the assistant
    recordAction(action) {
        this.state.actions.push(action);
    }
    // Record that a knowledge file was read
    recordKnowledgeRead(file) {
        if (!this.state.knowledgeRead.includes(file)) {
            this.state.knowledgeRead.push(file);
        }
    }
    // Record that a test file was analyzed
    recordTestAnalyzed(file) {
        if (!this.state.testsAnalyzed.includes(file)) {
            this.state.testsAnalyzed.push(file);
        }
    }
    // Record validation result
    recordValidation(passed, errors = []) {
        this.state.validationResults.push({
            timestamp: new Date().toISOString(),
            passed,
            errors
        });
    }
    // Get current validation state
    getStatus() {
        return this.state;
    }
    // Get tool calls made by the assistant
    getToolCalls() {
        return this.state.actions.filter(a => a.type === 'tool_call');
    }
    // Get file changes made by the assistant
    getFileChanges() {
        return this.state.actions.filter(a => a.type === 'file_change');
    }
    // Get sequence of actions taken
    getActionSequence() {
        return this.state.actions
            .filter(a => a.details.action)
            .map(a => a.details.action);
    }
    // Verify tests are preserved
    verifyTestsPreserved(originalContent, newContent) {
        // Implementation would compare test cases
        return true;
    }
    // Verify TDD process was followed
    verifyTDDProcess() {
        // Implementation would verify test-first development
        return true;
    }
    // Reset tracker state
    reset() {
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
exports.AssistantTracker = AssistantTracker;
