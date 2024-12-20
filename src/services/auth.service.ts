import { BaseService } from './base.service';
import type { LoginDto, RegisterDto, VerifyEmailDto } from '@bawes/erp-api-sdk';
import type { AxiosResponse } from 'axios';

/**
 * Response interface for successful login
 * @interface LoginResponse
 */
export interface LoginResponse {
  /** JWT access token for API authentication */
  access_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** User's unique identifier */
  id: string;
  /** User's name in English */
  nameEn: string;
  /** User's name in Arabic */
  nameAr: string;
  /** Current status of the user's account */
  accountStatus: string;
}

/**
 * Response interface for user profile data
 * @interface ProfileResponse
 */
export interface ProfileResponse {
  /** User's unique identifier */
  id: string;
  /** User's name in English */
  nameEn: string;
  /** User's name in Arabic */
  nameAr: string;
  /** Current status of the user's account */
  accountStatus: string;
}

/**
 * Service handling authentication and user session management
 * Provides methods for login, registration, email verification, and session management
 * 
 * @extends BaseService
 * 
 * @example
 * ```typescript
 * const authService = new AuthService();
 * 
 * // Login
 * const user = await authService.login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * 
 * // Get current user
 * const profile = await authService.getCurrentUser();
 * ```
 */
export class AuthService extends BaseService {
  /** Timer for token refresh */
  private refreshTokenTimeout?: NodeJS.Timeout;
  /** Cached user profile data */
  private currentUser: ProfileResponse | null = null;

  /**
   * Authenticates a user with their credentials
   * Sets up token refresh and caches user profile on success
   * 
   * @param {LoginDto} loginDto - Login credentials
   * @returns {Promise<LoginResponse>} Login response with tokens and user data
   * @throws {Error} If authentication fails
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const response = await this.client.auth.authControllerLogin(loginDto) as unknown as AxiosResponse<LoginResponse>;
      const data = response.data;
      this.client.setAccessToken(data.access_token);
      this.setupRefreshToken(data.expires_in);
      
      // Store the user profile from the login response
      this.currentUser = {
        id: data.id,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        accountStatus: data.accountStatus,
      };
      
      return data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Registers a new user account
   * 
   * @param {RegisterDto} registerDto - Registration data
   * @throws {Error} If registration fails
   */
  async register(registerDto: RegisterDto) {
    try {
      const response = await this.client.auth.authControllerRegister(registerDto);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Verifies a user's email address with a verification code
   * 
   * @param {VerifyEmailDto} verifyEmailDto - Email verification data
   * @throws {Error} If verification fails
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      const response = await this.client.auth.authControllerVerifyEmail(verifyEmailDto);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Logs out the current user
   * Clears tokens, refresh timer, and cached user data
   * 
   * @throws {Error} If logout fails
   */
  async logout() {
    try {
      await this.client.auth.authControllerLogout({
        refresh_token: 'dummy', // The actual token is sent via cookie
      });
      this.client.setAccessToken(null);
      this.clearRefreshTokenTimeout();
      this.currentUser = null;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Retrieves the current user's profile data
   * Returns cached profile data if available, null if not logged in
   * 
   * @returns {Promise<ProfileResponse | null>} Current user's profile or null
   */
  async getCurrentUser(): Promise<ProfileResponse | null> {
    try {
      if (!this.currentUser) {
        return null;
      }
      return this.currentUser;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Sets up automatic token refresh before expiration
   * @param {number} expiresIn - Token expiration time in seconds
   * @private
   */
  private setupRefreshToken(expiresIn: number) {
    this.clearRefreshTokenTimeout();
    const timeout = (expiresIn * 1000) - 60000; // Refresh 1 minute before expiry
    
    this.refreshTokenTimeout = setTimeout(() => {
      this.refresh().catch((error) => {
        console.error('Token refresh failed:', error);
        this.handleRefreshFailure();
      });
    }, timeout);
  }

  /**
   * Refreshes the access token before it expires
   * Updates cached user profile if new data is available
   * 
   * @returns {Promise<LoginResponse>} New tokens and user data
   * @throws {Error} If refresh fails
   * @private
   */
  private async refresh(): Promise<LoginResponse> {
    try {
      const response = await this.client.auth.authControllerRefresh({
        refresh_token: 'dummy', // The actual token is sent via cookie
      }) as unknown as AxiosResponse<LoginResponse>;
      const data = response.data;
      this.client.setAccessToken(data.access_token);
      this.setupRefreshToken(data.expires_in);
      
      // Update the user profile from the refresh response
      if (data.id) {
        this.currentUser = {
          id: data.id,
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          accountStatus: data.accountStatus,
        };
      }
      
      return data;
    } catch (error) {
      this.handleError(error);
      this.handleRefreshFailure();
      throw error;
    }
  }

  /**
   * Handles token refresh failures
   * Clears tokens and cached data
   * @private
   */
  private handleRefreshFailure() {
    this.client.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    this.currentUser = null;
    // Redirect to login or show session expired message
  }

  /**
   * Clears the token refresh timer
   * @private
   */
  private clearRefreshTokenTimeout() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }
} 