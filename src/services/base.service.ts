import { Configuration } from '@bawes/erp-api-sdk';
import { AxiosPromise } from 'axios';
import { getApiClient } from '@/lib/sdk/api';

export class BaseService {
  protected configuration: Configuration;
  protected client = getApiClient();

  constructor() {
    this.configuration = new Configuration({
      basePath: process.env.NEXT_PUBLIC_API_URL,
    });
  }

  protected async handleRequest<T>(promise: AxiosPromise<T>): Promise<T> {
    try {
      const response = await promise;
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  protected handleError(error: unknown): never {
    console.error('API Error:', error);
    throw error;
  }
} 