"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantTracker = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var AssistantTracker = /** @class */ (function () {
    function AssistantTracker() {
        this.statePath = (0, path_1.join)(process.cwd(), 'cursor/tools/validation/state.json');
        this.state = this.loadState();
    }
    AssistantTracker.prototype.loadState = function () {
        try {
            return JSON.parse((0, fs_1.readFileSync)(this.statePath, 'utf8'));
        }
        catch (_a) {
            return {
                knowledgeRead: [],
                testsAnalyzed: [],
                currentState: {
                    phase: 'knowledge',
                    completedSteps: [],
                    pendingSteps: ['read_knowledge', 'check_implementation', 'understand_tests']
                },
                validationResults: [],
                actions: []
            };
        }
    };
    AssistantTracker.prototype.saveState = function () {
        (0, fs_1.writeFileSync)(this.statePath, JSON.stringify(this.state, null, 2));
    };
    // Record that knowledge file has been read
    AssistantTracker.prototype.recordKnowledgeRead = function (filePath) {
        if (!this.state.knowledgeRead.includes(filePath)) {
            this.state.knowledgeRead.push(filePath);
            this.saveState();
        }
    };
    // Record that test has been analyzed
    AssistantTracker.prototype.recordTestAnalyzed = function (filePath) {
        if (!this.state.testsAnalyzed.includes(filePath)) {
            this.state.testsAnalyzed.push(filePath);
            this.saveState();
        }
    };
    // Record an assistant action
    AssistantTracker.prototype.recordAction = function (action) {
        this.state.actions.push(action);
        this.saveState();
    };
    // Get all tool calls
    AssistantTracker.prototype.getToolCalls = function () {
        return this.state.actions.filter(function (a) { return a.type === 'tool_call'; });
    };
    // Get all file changes
    AssistantTracker.prototype.getFileChanges = function () {
        return this.state.actions.filter(function (a) { return a.type === 'file_change'; });
    };
    // Get sequence of actions
    AssistantTracker.prototype.getActionSequence = function () {
        return this.state.actions.map(function (a) {
            if (a.type === 'tool_call')
                return a.details.tool || '';
            if (a.type === 'file_change')
                return 'file_change';
            return a.details.action || '';
        });
    };
    // Verify documentation was checked first
    AssistantTracker.prototype.verifyDocCheck = function () {
        var _a, _b;
        var firstCall = this.state.actions[0];
        return ((firstCall === null || firstCall === void 0 ? void 0 : firstCall.type) === 'tool_call' &&
            firstCall.details.tool === 'read_file' &&
            ((_b = (_a = firstCall.details.params) === null || _a === void 0 ? void 0 : _a.relative_workspace_path) === null || _b === void 0 ? void 0 : _b.includes('docs/cursor-knowledge.md')));
    };
    // Verify tests were preserved between changes
    AssistantTracker.prototype.verifyTestsPreserved = function (beforeFile, afterFile) {
        var beforeTests = this.extractTestCases(beforeFile);
        var afterTests = this.extractTestCases(afterFile);
        return beforeTests.every(function (test) {
            return afterTests.some(function (t) {
                return t.name === test.name &&
                    t.content === test.content;
            });
        });
    };
    // Verify TDD process was followed
    AssistantTracker.prototype.verifyTDDProcess = function () {
        var sequence = this.getActionSequence();
        return (sequence.includes('write_test') &&
            sequence.indexOf('write_test') < sequence.indexOf('implement_code') &&
            sequence.indexOf('implement_code') < sequence.indexOf('verify_test'));
    };
    // Extract test cases from file content
    AssistantTracker.prototype.extractTestCases = function (content) {
        var tests = [];
        var testRegex = /it\(['"](.+?)['"]\s*,\s*(?:async\s*)?\(\)\s*=>\s*{([\s\S]+?)}\)/g;
        var match;
        while ((match = testRegex.exec(content))) {
            tests.push({
                name: match[1],
                content: match[2].trim()
            });
        }
        return tests;
    };
    // Check if ready for implementation
    AssistantTracker.prototype.canImplement = function () {
        return (this.state.currentState.phase === 'analysis' &&
            this.state.knowledgeRead.length > 0 &&
            this.state.testsAnalyzed.length > 0);
    };
    // Record validation result
    AssistantTracker.prototype.recordValidation = function (passed, errors) {
        if (errors === void 0) { errors = []; }
        this.state.validationResults.push({
            timestamp: new Date().toISOString(),
            passed: passed,
            errors: errors
        });
        this.saveState();
    };
    // Get current validation status
    AssistantTracker.prototype.getStatus = function () {
        return __assign({}, this.state);
    };
    // Reset state for new task
    AssistantTracker.prototype.reset = function () {
        this.state = {
            knowledgeRead: [],
            testsAnalyzed: [],
            currentState: {
                phase: 'knowledge',
                completedSteps: [],
                pendingSteps: ['read_knowledge', 'check_implementation', 'understand_tests']
            },
            validationResults: [],
            actions: []
        };
        this.saveState();
    };
    return AssistantTracker;
}());
exports.AssistantTracker = AssistantTracker;
