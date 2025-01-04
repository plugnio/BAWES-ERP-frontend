/**
 * @jest-environment jsdom
 */

import { Configuration } from '@bawes/erp-api-sdk';
import { SDK_CONFIG, setTokenAccessor, createConfiguration } from './config';

// Mock the Configuration class
jest.mock('@bawes/erp-api-sdk', () => ({
  Configuration: jest.fn().mockImplementation((config) => ({
    ...config,
    // Add any additional mock methods needed
  }))
}));

describe('SDK Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset Configuration mock
    jest.clearAllMocks();
    // Reset process.env
    process.env = { ...originalEnv };
    // Set environment variables before importing SDK_CONFIG
    process.env.NEXT_PUBLIC_ERP_API_URL = 'https://api.test.com';
    // Re-import the module to get fresh config with new env vars
    jest.resetModules();
    const { SDK_CONFIG: freshConfig } = require('./config');
    Object.assign(SDK_CONFIG, freshConfig);
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  describe('SDK_CONFIG', () => {
    it('should have correct base URL from environment', () => {
      expect(SDK_CONFIG.baseUrl).toBe('https://api.test.com');
    });

    it('should have refresh threshold of 1 minute in milliseconds', () => {
      expect(SDK_CONFIG.refreshThreshold).toBe(60 * 1000);
    });
  });

  describe('Token Accessor', () => {
    it('should allow setting and using token accessor function', () => {
      const mockToken = 'test.jwt.token';
      const tokenFn = jest.fn().mockReturnValue(mockToken);

      setTokenAccessor(tokenFn);
      const config = createConfiguration();

      expect(tokenFn).toHaveBeenCalled();
      expect(config.baseOptions?.headers?.['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should handle null token accessor', () => {
      setTokenAccessor(null as any);
      const config = createConfiguration();

      expect(config.baseOptions?.headers?.['Authorization']).toBeUndefined();
    });

    it('should handle token accessor returning null', () => {
      const tokenFn = jest.fn().mockReturnValue(null);
      
      setTokenAccessor(tokenFn);
      const config = createConfiguration();

      expect(tokenFn).toHaveBeenCalled();
      expect(config.baseOptions?.headers?.['Authorization']).toBeUndefined();
    });
  });

  describe('createConfiguration', () => {
    it('should create configuration with correct base URL', () => {
      const config = createConfiguration();

      expect(Configuration).toHaveBeenCalledWith(expect.objectContaining({
        basePath: 'https://api.test.com'
      }));
      expect(config.basePath).toBe('https://api.test.com');
    });

    it('should set correct content type header', () => {
      const config = createConfiguration();

      expect(config.baseOptions?.headers?.['Content-Type']).toBe('application/json');
    });

    it('should enable withCredentials', () => {
      const config = createConfiguration();

      expect(config.baseOptions?.withCredentials).toBe(true);
    });

    it('should include authorization header when token is available', () => {
      const mockToken = 'test.jwt.token';
      setTokenAccessor(() => mockToken);

      const config = createConfiguration();

      expect(config.baseOptions?.headers?.['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should not include authorization header when no token is available', () => {
      setTokenAccessor(() => null);

      const config = createConfiguration();

      expect(config.baseOptions?.headers?.['Authorization']).toBeUndefined();
    });
  });
}); 