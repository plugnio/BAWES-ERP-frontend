import { Page, Request } from '@playwright/test';

interface ApiCall {
  url: string;
  method: string;
  timestamp: number;
  postData?: string | null;
  headers?: { [key: string]: string };
}

export class ApiTracker {
  private calls: ApiCall[] = [];

  constructor(page: Page) {
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        this.recordCall(request);
      }
    });
  }

  private recordCall(request: Request) {
    this.calls.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now(),
      postData: request.postData(),
      headers: request.headers()
    });
  }

  getCalls(): ApiCall[] {
    return this.calls;
  }

  getCallsSince(index: number): ApiCall[] {
    return this.calls.slice(index);
  }

  getEndpointCounts(): { [key: string]: number } {
    return this.calls.reduce((acc, call) => {
      acc[call.url] = (acc[call.url] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  getCallsByMethod(method: string): ApiCall[] {
    return this.calls.filter(call => call.method === method);
  }

  getCallsByEndpoint(endpoint: string): ApiCall[] {
    return this.calls.filter(call => call.url.includes(endpoint));
  }

  clear(): void {
    this.calls = [];
  }
}

export const trackApiCalls = (page: Page) => new ApiTracker(page); 