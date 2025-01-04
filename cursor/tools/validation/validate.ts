import { AssistantTracker } from './assistant-tracker';

interface ValidationResult {
  passed: boolean;
  errors: string[];
}

export async function validateAssistant(cursorLogPath: string): Promise<ValidationResult> {
  const tracker = new AssistantTracker(cursorLogPath);
  const errors: string[] = [];

  // Check if docs were read first
  if (!tracker.verifyDocCheck()) {
    errors.push('Assistant did not check documentation before making changes');
  }

  // Check if tests were preserved
  const fileChanges = tracker.getFileChanges();
  for (const change of fileChanges) {
    if (change.details.file?.endsWith('.spec.ts')) {
      const beforeFile = change.details.file;
      if (!tracker.verifyTestsPreserved(beforeFile, beforeFile)) {
        errors.push(`Tests were deleted or modified in ${beforeFile}`);
      }
    }
  }

  // Check TDD process
  if (!tracker.verifyTDDProcess()) {
    errors.push('TDD process was not followed (write test -> implement -> verify)');
  }

  // Check for linting errors in final state
  const finalChange = fileChanges[fileChanges.length - 1];
  if (finalChange?.details.content?.match(/error TS\d+/)) {
    errors.push('Linting errors were not fixed in final state');
  }

  return {
    passed: errors.length === 0,
    errors
  };
}

// Can be run directly
if (require.main === module) {
  const logPath = process.argv[2];
  if (!logPath) {
    console.error('Please provide path to cursor log file');
    process.exit(1);
  }

  validateAssistant(logPath).then(result => {
    console.log('Validation Result:', result.passed ? 'PASSED' : 'FAILED');
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(err => console.log(`- ${err}`));
    }
    process.exit(result.passed ? 0 : 1);
  });
} 