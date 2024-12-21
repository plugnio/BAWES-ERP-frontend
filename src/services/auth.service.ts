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
  /** User's permission bits */
  permissionBits: string;
}

/**
 * Service handling authentication and user session management
 * Provides methods for login, registration, email verification, and session management
 * 
 * @extends BaseService
 */
export class AuthService extends BaseService {
  /** Cached user profile data */
  private currentUser: ProfileResponse | null = null;

  /**
   * Extracts user profile from JWT payload
   * @param {JwtPayload} payload - The JWT payload
   * @returns {ProfileResponse} User profile data
   * @private
   */
  private extractUserFromPayload(payload: any): ProfileResponse {
    return {
      id: payload.sub,
      nameEn: payload.nameEn,
      nameAr: payload.nameAr,
      accountStatus: payload.accountStatus,
      permissionBits: payload.permissionBits
    };
  }

  /**
   * Authenticates a user with their credentials
   * Sets up token refresh and caches user profile from JWT
   * Access token is stored in memory, refresh token in HTTP-only cookie
   * 
   * @param {LoginDto} loginDto - Login credentials
   * @returns {Promise<LoginResponse>} Login response with tokens
   * @throws {Error} If authentication fails
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const response = await this.client.auth.authControllerLogin(loginDto) as unknown as AxiosResponse<LoginResponse>;
      const { access_token, expires_in } = response.data;
      
      // Set up token and refresh timer
      this.client.handleTokenResponse(response.data);
      
      // Extract user data from JWT payload
      const payload = this.client.getTokenPayload();
      if (payload) {
        this.currentUser = this.extractUserFromPayload(payload);
      }
      
      return response.data;
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
   * Clears access token from memory and refresh token via backend
   * 
   * @throws {Error} If logout fails
   */
  async logout() {
    try {
      await this.client.auth.authControllerLogout({
        refresh_token: 'dummy', // The actual token is sent via cookie
      });
      this.client.reset(); // Reset the API client state
      this.currentUser = null;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Retrieves the current user's profile data from JWT payload
   * Returns null if not logged in, token is invalid, or token is expired
   * 
   * @returns {Promise<ProfileResponse | null>} Current user's profile or null
   */
  async getCurrentUser(): Promise<ProfileResponse | null> {
    try {
      // If we have cached user data and a valid token exists, return it
      const payload = this.client.getTokenPayload();
      if (payload) {
        this.currentUser = this.extractUserFromPayload(payload);
        return this.currentUser;
      }

      // No valid token, try to refresh
      try {
        const response = await this.client.refreshToken();
        const payload = this.client.getTokenPayload();
        if (payload) {
          this.currentUser = this.extractUserFromPayload(payload);
          return this.currentUser;
        }
      } catch {
        // If refresh fails, we're not authenticated
        this.currentUser = null;
      }

      return null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }
} 