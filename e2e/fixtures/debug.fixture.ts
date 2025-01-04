import { test as base, Page, ConsoleMessage, Request, Response } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface DebugFixtures {
  debugPage: Page;
}

interface ConsoleLog {
  type: string;
  text: string;
  location: { url: string; lineNumber: number; columnNumber: number; };
  time: string;
}

interface NetworkRequest {
  url: string;
  method: string;
  headers: { [key: string]: string };
  time: string;
}

interface NetworkResponse extends NetworkRequest {
  status: number;
  statusText: string;
  body?: string;
}

interface PageError {
  message: string;
  stack?: string;
  time: string;
}

interface TestDebugInfo {
  logs: ConsoleLog[];
  requests: (NetworkRequest | NetworkResponse)[];
  errors: PageError[];
  timestamp: string;
}

// Extend the base test
export const test = base.extend<DebugFixtures>({
  debugPage: async ({ page }, use) => {
    const logs: ConsoleLog[] = [];
    const requests: (NetworkRequest | NetworkResponse)[] = [];
    const errors: PageError[] = [];

    // Clean up old debug files
    const debugDir = path.join(process.cwd(), 'e2e/debug-output');
    if (fs.existsSync(debugDir)) {
      const files = fs.readdirSync(debugDir);
      for (const file of files) {
        fs.unlinkSync(path.join(debugDir, file));
      }
    } else {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    // Capture console logs
    page.on('console', (msg: ConsoleMessage) => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        time: new Date().toISOString()
      });
    });

    // Capture page errors
    page.on('pageerror', (error: Error) => {
      errors.push({
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
    });

    // Capture network requests
    page.on('request', (request: Request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        time: new Date().toISOString()
      });
    });

    // Capture network responses
    page.on('response', async (response: Response) => {
      try {
        const request = response.request();
        const responseEntry: NetworkResponse = {
          url: request.url(),
          method: request.method(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          time: new Date().toISOString()
        };

        // Only capture response body for non-200 responses or if it's small
        if (response.status() !== 200) {
          try {
            responseEntry.body = await response.text();
          } catch (e) {
            responseEntry.body = 'Could not capture response body';
          }
        }

        requests.push(responseEntry);
      } catch (e) {
        console.error('Error capturing response:', e);
      }
    });

    // Use the page
    await use(page);

    // After test completes, write debug info to file
    const testInfo: TestDebugInfo = {
      logs,
      requests,
      errors,
      timestamp: new Date().toISOString()
    };

    const filename = path.join(debugDir, 'debug.json');
    fs.writeFileSync(filename, JSON.stringify(testInfo, null, 2));
  }
});

export { expect } from '@playwright/test'; 