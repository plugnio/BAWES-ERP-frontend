"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var assistant_tracker_1 = require("./assistant-tracker");
var WorkflowValidator = /** @class */ (function () {
    function WorkflowValidator() {
        this.tracker = new assistant_tracker_1.AssistantTracker();
        var configPath = (0, path_1.join)(process.cwd(), 'cursor/config/assistant.json');
        this.config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf8'));
    }
    // Validate start sequence is followed
    WorkflowValidator.prototype.validateStartSequence = function () {
        var status = this.tracker.getStatus();
        var sequence = this.config.workflow.start_sequence;
        // Check each required step
        for (var _i = 0, sequence_1 = sequence; _i < sequence_1.length; _i++) {
            var step = sequence_1[_i];
            switch (step.action) {
                case 'read_knowledge':
                    // Verify knowledge files are read
                    if (step.paths) {
                        var hasReadAll = step.paths.every(function (pattern) {
                            return status.knowledgeRead.some(function (file) { return file.match(pattern); });
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
                        var hasUsedAll = step.tools.every(function (tool) {
                            return status.currentState.completedSteps.includes(tool);
                        });
                        if (!hasUsedAll) {
                            this.tracker.recordValidation(false, ['Not all implementation checks completed']);
                            return false;
                        }
                    }
                    break;
                case 'understand_tests':
                    // Verify test files were analyzed
                    if (step.paths) {
                        var hasAnalyzedAll = step.paths.every(function (pattern) {
                            return status.testsAnalyzed.some(function (file) { return file.match(pattern); });
                        });
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
    };
    // Validate change sequence is followed
    WorkflowValidator.prototype.validateChangeSequence = function () {
        var status = this.tracker.getStatus();
        var sequence = this.config.workflow.change_sequence;
        // Check sequence order
        var actions = this.tracker.getActionSequence();
        var lastIndex = -1;
        var _loop_1 = function (step) {
            var currentIndex = actions.findIndex(function (a) { return a === step.action; });
            if (currentIndex === -1) {
                this_1.tracker.recordValidation(false, ["Missing required step: ".concat(step.action)]);
                return { value: false };
            }
            if (currentIndex < lastIndex) {
                this_1.tracker.recordValidation(false, ["Invalid step order: ".concat(step.action)]);
                return { value: false };
            }
            lastIndex = currentIndex;
        };
        var this_1 = this;
        for (var _i = 0, sequence_2 = sequence; _i < sequence_2.length; _i++) {
            var step = sequence_2[_i];
            var state_1 = _loop_1(step);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        this.tracker.recordValidation(true);
        return true;
    };
    // Validate required checks are performed
    WorkflowValidator.prototype.validateRequiredChecks = function () {
        var status = this.tracker.getStatus();
        var checks = this.config.validation.required_checks;
        for (var _i = 0, checks_1 = checks; _i < checks_1.length; _i++) {
            var check = checks_1[_i];
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
    };
    WorkflowValidator.prototype.validateDocCheck = function (paths) {
        var status = this.tracker.getStatus();
        var hasReadAll = paths.every(function (pattern) {
            return status.knowledgeRead.some(function (file) { return file.match(pattern); });
        });
        if (!hasReadAll) {
            this.tracker.recordValidation(false, ['Documentation check failed']);
            return false;
        }
        return true;
    };
    WorkflowValidator.prototype.validateTestPreservation = function (patterns) {
        var fileChanges = this.tracker.getFileChanges();
        var _loop_2 = function (change) {
            if (!change.details.file)
                return "continue";
            // Check if file matches test patterns
            if (patterns.some(function (pattern) { var _a; return (_a = change.details.file) === null || _a === void 0 ? void 0 : _a.match(pattern); })) {
                // Get original content
                var originalContent = (0, fs_1.readFileSync)(change.details.file, 'utf8');
                var newContent = change.details.content || '';
                if (!this_2.tracker.verifyTestsPreserved(originalContent, newContent)) {
                    this_2.tracker.recordValidation(false, ['Test cases were deleted or modified']);
                    return { value: false };
                }
            }
        };
        var this_2 = this;
        for (var _i = 0, fileChanges_1 = fileChanges; _i < fileChanges_1.length; _i++) {
            var change = fileChanges_1[_i];
            var state_2 = _loop_2(change);
            if (typeof state_2 === "object")
                return state_2.value;
        }
        return true;
    };
    WorkflowValidator.prototype.validateTDDProcess = function (sequence) {
        return this.tracker.verifyTDDProcess();
    };
    WorkflowValidator.prototype.validateLinting = function (waitTime) {
        // Implementation would verify linting was run with proper wait time
        return true;
    };
    // Reset validation state
    WorkflowValidator.prototype.reset = function () {
        this.tracker.reset();
    };
    return WorkflowValidator;
}());
exports.WorkflowValidator = WorkflowValidator;
