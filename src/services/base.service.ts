import { Configuration } from '@bawes/erp-api-sdk';
import { AxiosPromise } from 'axios';
import { getApiClient } from '@/lib/sdk/api';
import { debugLog } from '@/lib/debug';

/**
 * Base service class that provides common functionality for all API services
 * Handles API configuration, request processing, and error handling
 * 
 * @example
 * ```typescript
 * class UserService extends BaseService {
 *   async getUser(id: string) {
 *     return this.handleRequest(this.client.get(`/users/${id}`));
 *   }
 * }
 * ```
 */
export class BaseService {
  /** API client instance */
  protected client = getApiClient();

  constructor() {
    // Configuration is handled by SDK config
    this.client.onTokenChange(() => {
      if ('clearCache' in this) {
        (this as any).clearCache();
      }
    });
  }

  /**
   * Handles API requests and unwraps the response data
   * @template T The expected response data type
   * @param {AxiosPromise<T>} promise The axios promise to handle
   * @returns {Promise<T>} The unwrapped response data
   * @throws {Error} If the request fails
   */
  protected async handleRequest<T>(promise: AxiosPromise<T>): Promise<T> {
    try {
      const response = await promise;
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handles API errors in a consistent way
   * @param {unknown} error The error that occurred
   * @throws {Error} Always throws the error after logging
   */
  protected handleError(error: unknown): never {
    debugLog('API Error:', error);
    throw error;
  }
} 