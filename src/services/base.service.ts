import { Configuration } from '@bawes/erp-api-sdk';

export class BaseService {
  protected configuration: Configuration;

  constructor() {
    this.configuration = new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_URL,
    });
  }

  protected handleError(error: unknown): never {
    console.error('API Error:', error);
    throw error;
  }
} 