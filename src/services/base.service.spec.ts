import { BaseService } from './base.service';
import { getApiClient } from '@/lib/sdk/api';
import { debugLog } from '@/lib/debug';

// Mock dependencies
jest.mock('@/lib/sdk/api', () => ({
  getApiClient: jest.fn()
}));

jest.mock('@/lib/debug', () => ({
  debugLog: jest.fn()
}));

// Test implementation of BaseService
class TestService extends BaseService {
  // Expose protected methods for testing
  public async testHandleRequest<T>(promise: Promise<{ data: T }>) {
    return this.handleRequest(promise as any);
  }

  public testHandleError(error: unknown) {
    return this.handleError(error);
  }

  // Add clearCache for testing token change behavior
  public clearCache = jest.fn();
}

describe('BaseService', () => {
  let service: TestService;
  let mockApiClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock API client
    mockApiClient = {
      onTokenChange: jest.fn().mockImplementation((callback) => {
        // Store callback for testing
        mockApiClient._tokenChangeCallback = callback;
        return () => {}; // Return unsubscribe function
      })
    };

    (getApiClient as jest.Mock).mockReturnValue(mockApiClient);

    service = new TestService();
  });

  describe('constructor', () => {
    it('should setup token change handler', () => {
      expect(mockApiClient.onTokenChange).toHaveBeenCalled();
    });

    it('should call clearCache when token changes', () => {
      // Trigger token change callback
      mockApiClient._tokenChangeCallback(true);

      expect(service.clearCache).toHaveBeenCalled();
    });
  });

  describe('handleRequest', () => {
    it('should unwrap successful response data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockPromise = Promise.resolve({ data: mockData });

      const result = await service.testHandleRequest(mockPromise);

      expect(result).toEqual(mockData);
    });

    it('should handle and rethrow errors', async () => {
      const mockError = new Error('API Error');
      const mockPromise = Promise.reject(mockError);

      await expect(service.testHandleRequest(mockPromise)).rejects.toThrow(mockError);
      expect(debugLog).toHaveBeenCalledWith('API Error:', mockError);
    });
  });

  describe('handleError', () => {
    it('should log error and rethrow', () => {
      const mockError = new Error('Test Error');

      expect(() => service.testHandleError(mockError)).toThrow(mockError);
      expect(debugLog).toHaveBeenCalledWith('API Error:', mockError);
    });
  });
}); 