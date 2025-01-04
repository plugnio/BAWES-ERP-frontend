/**
 * @jest-environment jsdom
 */

// Mock dependencies first
jest.mock('@/lib/debug', () => ({
  debugLog: jest.fn(),
}));

jest.mock('@bawes/erp-api-sdk', () => ({
  Configuration: jest.fn().mockImplementation((config) => config),
  AuthenticationApi: jest.fn(),
  PeopleApi: jest.fn(),
  PermissionsApi: jest.fn(),
  RolesApi: jest.fn(),
}));

// Mock config module
jest.mock('./config', () => {
  let getTokenFn: (() => string | null) | null = null;
  return {
    SDK_CONFIG: {
      baseUrl: 'http://test-api.com',
      refreshThreshold: 60 * 1000,
    },
    setTokenAccessor: (fn: () => string | null) => {
      getTokenFn = fn;
    },
    createConfiguration: () => ({
      basePath: 'http://test-api.com',
      baseOptions: {
        headers: {
          'Content-Type': 'application/json',
          ...(getTokenFn?.() ? { 'Authorization': `Bearer ${getTokenFn()}` } : {}),
        },
        withCredentials: true,
      },
    }),
  };
});

// Then import modules
import { getApiClient } from './api';
import { debugLog } from '@/lib/debug';
import { AuthenticationApi, PeopleApi, PermissionsApi, RolesApi } from '@bawes/erp-api-sdk';

describe('ApiClient', () => {
  let apiClient: ReturnType<typeof getApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup API service mocks
    (AuthenticationApi as jest.Mock).mockImplementation(() => ({}));
    (PeopleApi as jest.Mock).mockImplementation(() => ({}));
    (PermissionsApi as jest.Mock).mockImplementation(() => ({}));
    (RolesApi as jest.Mock).mockImplementation(() => ({}));

    // Reset singleton instance and get new instance
    const ApiClientModule = jest.requireActual('./api');
    (ApiClientModule.getApiClient as any).instance = undefined;
    apiClient = getApiClient();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const client1 = getApiClient();
      const client2 = getApiClient();
      expect(client1).toBe(client2);
    });

    it('should initialize API services', () => {
      expect(apiClient.auth).toBeDefined();
      expect(apiClient.people).toBeDefined();
      expect(apiClient.permissions).toBeDefined();
      expect(apiClient.roles).toBeDefined();
    });

    it('should handle token in configuration', () => {
      // Initially no token
      const config1 = apiClient['configuration'];
      expect(config1.baseOptions.headers['Authorization']).toBeUndefined();

      // Set token and verify it's used
      apiClient.setAccessToken('test-token');
      const config2 = apiClient['configuration'];
      expect(config2.baseOptions.headers['Authorization']).toBe('Bearer test-token');

      // Clear token and verify it's removed
      apiClient.setAccessToken(null);
      const config3 = apiClient['configuration'];
      expect(config3.baseOptions.headers['Authorization']).toBeUndefined();
    });
  });

  describe('token management', () => {
    it('should set and get access token', () => {
      const token = 'test-token';
      apiClient.setAccessToken(token);
      expect(apiClient.getAccessToken()).toBe(token);
    });

    it('should notify listeners on token change', () => {
      const listener = jest.fn();
      apiClient.onTokenChange(listener);

      apiClient.setAccessToken('new-token');
      expect(listener).toHaveBeenCalledWith(true);

      apiClient.setAccessToken(null);
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('should handle token expiry updates', () => {
      const timeListener = jest.fn();
      apiClient.onTimeUpdate(timeListener);

      apiClient.setAccessToken('test-token');
      jest.advanceTimersByTime(1000);

      expect(timeListener).toHaveBeenCalled();
    });

    it('should unsubscribe listeners', () => {
      const listener = jest.fn();
      const unsubscribe = apiClient.onTokenChange(listener);

      // First call to verify listener works
      apiClient.setAccessToken('test-token');
      expect(listener).toHaveBeenCalledWith(true);

      // Reset mock to check unsubscribe
      listener.mockReset();
      unsubscribe();
      
      apiClient.setAccessToken('new-token');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('token refresh', () => {
    it('should schedule token refresh', () => {
      const token = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresIn: 3600
      };

      apiClient.setAccessToken(token.accessToken);
      
      expect(debugLog).toHaveBeenCalledWith('ApiClient: Setting access token', {
        hasToken: true,
        tokenLength: token.accessToken.length
      });
    });

    it('should clear refresh timer on token removal', () => {
      apiClient.setAccessToken('test-token');
      apiClient.setAccessToken(null);

      expect(debugLog).toHaveBeenLastCalledWith('ApiClient: Setting access token', {
        hasToken: false,
        tokenLength: 0
      });
    });
  });

  describe('error handling', () => {
    it('should handle refresh failures', async () => {
      // Mock refresh failure
      apiClient.auth.authControllerRefresh = jest.fn().mockRejectedValue(new Error('Refresh failed'));

      apiClient.setAccessToken('expired-token');
      expect(debugLog).toHaveBeenCalledWith('ApiClient: Setting access token', {
        hasToken: true,
        tokenLength: 13
      });

      // Wait for any promises to resolve
      await jest.runAllTimersAsync();
      await Promise.resolve();

      expect(apiClient.getAccessToken()).toBe('expired-token');
    });
  });
}); 