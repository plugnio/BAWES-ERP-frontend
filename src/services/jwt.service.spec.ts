import { JwtService } from './jwt.service';
import { getApiClient } from '@/lib/sdk/api';

// Mock the API client module
jest.mock('@/lib/sdk/api', () => ({
  getApiClient: jest.fn()
}));

describe('JwtService', () => {
  let jwtService: JwtService & { clearCache: jest.Mock };
  let mockApiClient: any;

  // Helper function to create base64 encoded JWT parts
  const base64Encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64');

  // Sample valid JWT token parts
  const validHeader = base64Encode({ alg: 'HS256', typ: 'JWT' });
  const validPayload = {
    sub: 'user123',
    nameEn: 'Test User',
    nameAr: 'Test User AR',
    accountStatus: 'active',
    permissionBits: '1111',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000)
  };
  const validToken = `${validHeader}.${base64Encode(validPayload)}.signature`;

  // Sample expired token
  const expiredPayload = {
    ...validPayload,
    exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
  };
  const expiredToken = `${validHeader}.${base64Encode(expiredPayload)}.signature`;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock API client
    mockApiClient = {
      onTokenChange: jest.fn().mockImplementation((callback) => {
        // Store callback for testing
        mockApiClient._tokenChangeCallback = callback;
        return () => {}; // Return unsubscribe function
      }),
      getAccessToken: jest.fn().mockReturnValue(validToken),
      getTimeToExpiry: jest.fn().mockReturnValue(3600)
    };

    (getApiClient as jest.Mock).mockReturnValue(mockApiClient);

    jwtService = new JwtService() as JwtService & { clearCache: jest.Mock };
    jwtService.clearCache = jest.fn().mockImplementation(() => {
      jwtService.invalidateCache();
    });
  });

  describe('decodeToken', () => {
    it('should successfully decode a valid token', () => {
      const result = jwtService.decodeToken(validToken);
      
      expect(result).toEqual(validPayload);
    });

    it('should throw error for invalid token format', () => {
      const invalidToken = 'invalid.token.format';
      
      expect(() => jwtService.decodeToken(invalidToken)).toThrow('Invalid token format');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-even-a-token';
      
      expect(() => jwtService.decodeToken(malformedToken)).toThrow('Invalid token format');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const result = jwtService.isTokenExpired(validPayload);
      
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const result = jwtService.isTokenExpired(expiredPayload);
      
      expect(result).toBe(true);
    });
  });

  describe('getCurrentPayload', () => {
    it('should return payload for valid token', () => {
      mockApiClient.getAccessToken.mockReturnValue(validToken);
      
      const result = jwtService.getCurrentPayload();
      
      expect(result).toEqual(validPayload);
    });

    it('should return null when no token exists', () => {
      mockApiClient.getAccessToken.mockReturnValue(null);
      
      const result = jwtService.getCurrentPayload();
      
      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      mockApiClient.getAccessToken.mockReturnValue(expiredToken);
      
      const result = jwtService.getCurrentPayload();
      
      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      mockApiClient.getAccessToken.mockReturnValue('invalid.token.format');
      
      const result = jwtService.getCurrentPayload();
      
      expect(result).toBeNull();
    });
  });

  describe('getTokenState', () => {
    it('should return complete state for valid token', () => {
      mockApiClient.getAccessToken.mockReturnValue(validToken);
      mockApiClient.getTimeToExpiry.mockReturnValue(3600);
      
      const result = jwtService.getTokenState();
      
      expect(result).toEqual({
        token: validToken,
        payload: validPayload,
        timeToExpiry: 3600
      });
    });

    it('should return null state when no token exists', () => {
      mockApiClient.getAccessToken.mockReturnValue(null);
      
      const result = jwtService.getTokenState();
      
      expect(result).toEqual({
        token: null,
        payload: null,
        timeToExpiry: 0
      });
    });

    it('should return null state for expired token', () => {
      mockApiClient.getAccessToken.mockReturnValue(expiredToken);
      
      const result = jwtService.getTokenState();
      
      expect(result).toEqual({
        token: null,
        payload: null,
        timeToExpiry: 0
      });
    });

    it('should use cached state if available and valid', () => {
      // First call to cache the state
      const firstResult = jwtService.getTokenState();
      
      // Change the mock return value
      mockApiClient.getAccessToken.mockReturnValue('different.token.value');
      
      // Second call should return cached value
      const secondResult = jwtService.getTokenState();
      
      expect(secondResult).toEqual(firstResult);
    });

    it('should refresh cache if invalidated', () => {
      // First call to cache the state
      const firstResult = jwtService.getTokenState();
      
      // Change the mock return value
      const newToken = `${validHeader}.${base64Encode({
        ...validPayload,
        sub: 'newuser123'
      })}.signature`;
      mockApiClient.getAccessToken.mockReturnValue(newToken);
      
      // Invalidate cache
      jwtService.invalidateCache();
      
      // Next call should get fresh state
      const secondResult = jwtService.getTokenState();
      
      expect(secondResult).not.toEqual(firstResult);
      expect(secondResult.token).toBe(newToken);
    });

    it('should clear cache on token change', () => {
      // First call to cache the state
      const firstResult = jwtService.getTokenState();
      
      // Change the mock return value
      const newToken = `${validHeader}.${base64Encode({
        ...validPayload,
        sub: 'newuser123'
      })}.signature`;
      mockApiClient.getAccessToken.mockReturnValue(newToken);
      
      // Spy on clearCache
      const clearCacheSpy = jest.spyOn(jwtService, 'clearCache');
      
      // Trigger token change callback
      mockApiClient._tokenChangeCallback(true);
      
      // Verify clearCache was called
      expect(clearCacheSpy).toHaveBeenCalled();
      
      // Next call should get fresh state
      const secondResult = jwtService.getTokenState();
      
      expect(secondResult.token).toBe(newToken);
    });
  });
}); 