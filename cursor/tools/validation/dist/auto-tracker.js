"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoTracker = void 0;
class AutoTracker {
    constructor(tracker) {
        this.tracker = tracker;
    }
    trackToolCall(tool, params) {
        // Record the tool call
        this.tracker.recordAction({
            type: 'tool_call',
            timestamp: Date.now(),
            details: {
                tool,
                params
            }
        });
        // Handle special cases
        if (tool === 'read_file') {
            const path = params.relative_workspace_path;
            if (path.includes('cursor/knowledge/')) {
                this.tracker.recordKnowledgeRead(path);
            }
            if (path.endsWith('.spec.ts')) {
                this.tracker.recordTestAnalyzed(path);
            }
        }
    }
    validateWorkflow() {
        const status = this.tracker.getStatus();
        const errors = [];
        // Check start sequence
        if (status.currentState.phase === 'knowledge' && status.currentState.pendingSteps.length > 0) {
            errors.push('Start sequence not complete');
        }
        // Check test before implementation
        if (status.currentState.phase === 'implementation' &&
            status.testsAnalyzed.length === 0 &&
            !status.currentState.completedSteps.includes('write_test')) {
            errors.push('Must write tests before implementation');
        }
        // Check knowledge read
        if (status.knowledgeRead.length === 0) {
            errors.push('Must read knowledge files first');
        }
        return {
            passed: errors.length === 0,
            errors
        };
    }
}
exports.AutoTracker = AutoTracker;
