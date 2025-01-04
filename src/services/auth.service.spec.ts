import { AuthService } from './auth.service';
import { ServiceRegistry } from './index';
import { getApiClient } from '@/lib/sdk/api';
import type { LoginDto, RegisterDto, VerifyEmailDto } from '@bawes/erp-api-sdk';
import { AxiosError, AxiosResponse } from 'axios';

// Mock the API client module
jest.mock('@/lib/sdk/api', () => ({
  getApiClient: jest.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockApiClient: any;
  let mockJwtService: any;

  const mockLoginResponse = {
    data: {
      access_token: 'mock.jwt.token',
      expires_in: 3600
    }
  } as AxiosResponse;

  const mockJwtPayload = {
    sub: 'user123',
    nameEn: 'Test User',
    nameAr: 'مستخدم تجريبي',
    accountStatus: 'active',
    permissionBits: '1111'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock API client
    mockApiClient = {
      auth: {
        authControllerLogin: jest.fn().mockResolvedValue(mockLoginResponse),
        authControllerRegister: jest.fn(),
        authControllerVerifyEmail: jest.fn(),
        authControllerLogout: jest.fn()
      },
      onTokenChange: jest.fn().mockReturnValue(() => {}),
      onTimeUpdate: jest.fn().mockReturnValue(() => {}),
      handleTokenResponse: jest.fn(),
      getTokenPayload: jest.fn().mockReturnValue(mockJwtPayload),
      reset: jest.fn(),
      refreshToken: jest.fn()
    };

    (getApiClient as jest.Mock).mockReturnValue(mockApiClient);

    // Setup mock JWT service
    mockJwtService = {
      invalidateCache: jest.fn(),
      getTokenState: jest.fn().mockReturnValue({ 
        payload: mockJwtPayload, 
        token: 'mock.jwt.token' 
      })
    };

    // Mock ServiceRegistry
    jest.spyOn(ServiceRegistry, 'getInstance').mockReturnValue({
      jwt: mockJwtService
    } as any);

    // Initialize service
    authService = new AuthService();
  });

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should successfully login and setup token', async () => {
      mockApiClient.auth.authControllerLogin.mockResolvedValue(mockLoginResponse);

      const result = await authService.login(mockLoginDto);

      expect(result).toEqual(mockLoginResponse.data);
      expect(mockApiClient.handleTokenResponse).toHaveBeenCalledWith(mockLoginResponse.data);
      expect(mockJwtService.invalidateCache).toHaveBeenCalled();
    });

    it('should handle login failure', async () => {
      const mockError = new AxiosError('Login failed');
      mockApiClient.auth.authControllerLogin.mockRejectedValue(mockError);

      await expect(authService.login(mockLoginDto)).rejects.toThrow(mockError);
    });
  });

  describe('logout', () => {
    it('should successfully logout and clear state', async () => {
      await authService.logout();

      expect(mockApiClient.auth.authControllerLogout).toHaveBeenCalled();
      expect(mockApiClient.reset).toHaveBeenCalled();
      expect(mockJwtService.invalidateCache).toHaveBeenCalled();
    });

    it('should handle logout failure', async () => {
      const mockError = new AxiosError('Logout failed');
      mockApiClient.auth.authControllerLogout.mockRejectedValue(mockError);

      await expect(authService.logout()).rejects.toThrow(mockError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return cached user if available', async () => {
      // Setup successful login to cache the user
      const loginDto = { email: 'test@example.com', password: 'password123' };
      await authService.login(loginDto);
      
      const user = await authService.getCurrentUser();
      
      expect(user).toEqual({
        id: mockJwtPayload.sub,
        nameEn: mockJwtPayload.nameEn,
        nameAr: mockJwtPayload.nameAr,
        accountStatus: mockJwtPayload.accountStatus,
        permissionBits: mockJwtPayload.permissionBits
      });
    });

    it('should attempt token refresh if no cached user', async () => {
      // Setup JWT service to return no token initially, then valid token after refresh
      mockJwtService.getTokenState
        .mockReturnValueOnce({ payload: null, token: null })
        .mockReturnValue({ payload: mockJwtPayload, token: 'refreshed.token' });
      
      const user = await authService.getCurrentUser();
      
      expect(mockApiClient.refreshToken).toHaveBeenCalled();
      expect(user).toEqual({
        id: mockJwtPayload.sub,
        nameEn: mockJwtPayload.nameEn,
        nameAr: mockJwtPayload.nameAr,
        accountStatus: mockJwtPayload.accountStatus,
        permissionBits: mockJwtPayload.permissionBits
      });
    });

    it('should return null if refresh fails', async () => {
      // Setup JWT service to return no token
      mockJwtService.getTokenState.mockReturnValue({ payload: null, token: null });
      // Setup refresh to fail
      mockApiClient.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      
      const user = await authService.getCurrentUser();
      
      expect(user).toBeNull();
    });
  });

  describe('register', () => {
    const mockRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      nameEn: 'Test User',
      nameAr: 'مستخدم تجريبي'
    };

    it('should successfully register a new user', async () => {
      const mockResponse = { data: { success: true } };
      mockApiClient.auth.authControllerRegister.mockResolvedValue(mockResponse);

      const result = await authService.register(mockRegisterDto);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle registration failure', async () => {
      const mockError = new AxiosError('Registration failed');
      mockApiClient.auth.authControllerRegister.mockRejectedValue(mockError);

      await expect(authService.register(mockRegisterDto)).rejects.toThrow(mockError);
    });
  });

  describe('verifyEmail', () => {
    const mockVerifyEmailDto: VerifyEmailDto = {
      email: 'test@example.com',
      code: '123456'
    };

    it('should successfully verify email', async () => {
      const mockResponse = { data: { success: true } };
      mockApiClient.auth.authControllerVerifyEmail.mockResolvedValue(mockResponse);

      const result = await authService.verifyEmail(mockVerifyEmailDto);

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle verification failure', async () => {
      const mockError = new AxiosError('Verification failed');
      mockApiClient.auth.authControllerVerifyEmail.mockRejectedValue(mockError);

      await expect(authService.verifyEmail(mockVerifyEmailDto)).rejects.toThrow(mockError);
    });
  });

  describe('token change subscriptions', () => {
    it('should properly handle token change subscriptions', () => {
      const mockCallback = jest.fn();
      
      const unsubscribe = authService.onTokenChange(mockCallback);
      
      expect(mockApiClient.onTokenChange).toHaveBeenCalledWith(mockCallback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should properly handle time update subscriptions', () => {
      const mockCallback = jest.fn();
      
      const unsubscribe = authService.onTimeUpdate(mockCallback);
      
      expect(mockApiClient.onTimeUpdate).toHaveBeenCalledWith(mockCallback);
      expect(typeof unsubscribe).toBe('function');
    });
  });
}); 