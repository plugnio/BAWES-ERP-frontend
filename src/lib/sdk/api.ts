import {
  Configuration,
  AuthenticationApi,
  PeopleApi,
  PermissionManagementApi,
  RoleManagementApi,
} from '@bawes/erp-api-sdk';
import { SDK_CONFIG, createConfiguration } from './config';

/**
 * Response structure for authentication token operations
 */
interface TokenResponse {
  /** JWT access token */
  access_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
}

/**
 * Singleton client for managing API communication and authentication
 * Handles token management, automatic refresh, and provides access to API endpoints
 */
class ApiClient {
  private static instance: ApiClient;
  private configuration: Configuration;
  private accessToken: string | null = null;
  private refreshTokenTimeout?: NodeJS.Timeout;

  /** Authentication API instance */
  readonly auth: AuthenticationApi;
  /** People management API instance */
  readonly people: PeopleApi;
  /** Permission management API instance */
  readonly permissions: PermissionManagementApi;
  /** Role management API instance */
  readonly roles: RoleManagementApi;

  private constructor() {
    this.configuration = createConfiguration();

    // Initialize API instances
    this.auth = new AuthenticationApi(this.configuration);
    this.people = new PeopleApi(this.configuration);
    this.permissions = new PermissionManagementApi(this.configuration);
    this.roles = new RoleManagementApi(this.configuration);
  }

  /**
   * Gets the singleton instance of the API client
   * Creates a new instance if one doesn't exist
   * @returns {ApiClient} The API client instance
   */
  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Sets the current access token for API requests
   * @param {string | null} token - The access token or null to clear
   */
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  /**
   * Gets the current access token
   * @returns {string | null} The current access token or null if not set
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Sets up automatic token refresh before expiration
   * Clears any existing refresh timeout before setting new one
   * @param {number} expiresIn - Token expiration time in seconds
   */
  setupRefreshToken(expiresIn: number) {
    this.clearRefreshTokenTimeout();
    const timeout = (expiresIn * 1000) - SDK_CONFIG.refreshThreshold;
    
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().catch((error) => {
        console.error('Token refresh failed:', error);
        this.handleRefreshFailure();
      });
    }, timeout);
  }

  /**
   * Attempts to refresh the access token
   * Uses the refresh token stored in cookies
   * @returns {Promise<TokenResponse>} New token response
   * @throws {Error} If refresh fails or response format is invalid
   */
  private async refreshToken(): Promise<TokenResponse> {
    try {
      const response = await this.auth.authControllerRefresh({
        refresh_token: 'dummy', // The actual token is sent via cookie
      });

      // Type guard to ensure response has the expected structure
      const data = response.data as unknown;
      if (
        typeof data === 'object' &&
        data !== null &&
        'access_token' in data &&
        'expires_in' in data &&
        typeof data.access_token === 'string' &&
        typeof data.expires_in === 'number'
      ) {
        const tokenResponse = data as TokenResponse;
        this.setAccessToken(tokenResponse.access_token);
        this.setupRefreshToken(tokenResponse.expires_in);
        return tokenResponse;
      }

      throw new Error('Invalid token response format');
    } catch (error) {
      this.handleRefreshFailure();
      throw error;
    }
  }

  /**
   * Handles token refresh failures
   * Clears the current token and refresh timeout
   * Allows auth hook to handle redirect to login
   */
  private handleRefreshFailure() {
    this.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    // Redirect to login will be handled by the auth hook
  }

  /**
   * Clears any existing refresh token timeout
   */
  private clearRefreshTokenTimeout() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  /**
   * Resets the client state
   * Clears the access token and refresh timeout
   */
  reset() {
    this.accessToken = null;
    this.clearRefreshTokenTimeout();
  }
}

/**
 * Gets the singleton instance of the API client
 * @returns {ApiClient} The API client instance
 */
export const getApiClient = () => ApiClient.getInstance();

/**
 * Resets the API client state
 * Useful for logout operations
 */
export const resetApiClient = () => {
  const client = ApiClient.getInstance();
  client.reset();
}; 