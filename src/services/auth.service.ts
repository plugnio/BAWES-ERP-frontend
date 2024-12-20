import { BaseService } from './base.service';
import { JwtService } from './jwt.service';
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
  /** JWT service instance */
  private jwtService: JwtService;
  /** Cached user profile data */
  private currentUser: ProfileResponse | null = null;

  constructor() {
    super();
    this.jwtService = new JwtService();
  }

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
      
      // Store access token and setup refresh
      this.jwtService.setCurrentToken(access_token);
      this.client.setupRefreshToken(expires_in);
      
      // Extract user data from JWT payload
      const payload = this.jwtService.decodeToken(access_token);
      this.currentUser = this.extractUserFromPayload(payload);
      
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
      this.jwtService.setCurrentToken(null);
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
      if (this.currentUser && this.jwtService.getCurrentToken()) {
        return this.currentUser;
      }

      // Try to get user data from JWT payload
      const payload = this.jwtService.getCurrentPayload();
      if (payload) {
        this.currentUser = this.extractUserFromPayload(payload);
        return this.currentUser;
      }

      // No valid token or payload, return null
      // Don't attempt refresh as it will be handled by the SDK's automatic refresh
      return null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Refreshes the access token using the refresh token cookie
   * Updates user data from new JWT payload
   * 
   * @returns {Promise<LoginResponse>} New tokens
   * @throws {Error} If refresh fails
   */
  async refresh(): Promise<LoginResponse> {
    try {
      const response = await this.client.auth.authControllerRefresh({
        refresh_token: 'dummy', // The actual token is sent via cookie
      }) as unknown as AxiosResponse<LoginResponse>;
      
      const { access_token, expires_in } = response.data;
      this.jwtService.setCurrentToken(access_token);
      this.client.setupRefreshToken(expires_in);
      
      // Extract user data from new JWT payload
      const payload = this.jwtService.decodeToken(access_token);
      this.currentUser = this.extractUserFromPayload(payload);
      
      return response.data;
    } catch (error: any) {
      // Don't attempt logout on refresh failure
      // Just clear local state and let the auth hook handle redirection
      this.jwtService.setCurrentToken(null);
      this.client.reset();
      this.currentUser = null;
      throw error;
    }
  }
} 