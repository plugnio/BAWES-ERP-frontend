import {
  Configuration,
  AuthenticationApi,
  PeopleApi,
  PermissionManagementApi,
  RoleManagementApi,
} from '@bawes/erp-api-sdk';
import { SDK_CONFIG, createConfiguration } from './config';
import { debugLog } from '@/lib/debug';

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
  private readonly REFRESH_TOKEN_COOKIE = 'refresh_token';

  /** Authentication API instance */
  readonly auth: AuthenticationApi;
  /** People management API instance */
  readonly people: PeopleApi;
  /** Permission management API instance */
  readonly permissions: PermissionManagementApi;
  /** Role management API instance */
  readonly roles: RoleManagementApi;

  private constructor() {
    debugLog('ApiClient: Initializing');
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
    debugLog(`ApiClient: Setting access token - hasToken: ${!!token}, tokenLength: ${token?.length || 0}`);
    this.accessToken = token;
  }

  /**
   * Gets the current access token
   * @returns {string | null} The current access token or null if not set
   */
  getAccessToken(): string | null {
    debugLog(`ApiClient: Getting access token - hasToken: ${!!this.accessToken}, tokenLength: ${this.accessToken?.length || 0}`);
    return this.accessToken;
  }

  /**
   * Sets up automatic token refresh before expiration
   * Clears any existing refresh timeout before setting new one
   * @param {number} expiresIn - Token expiration time in seconds
   */
  setupRefreshToken(expiresIn: number) {
    debugLog(`ApiClient: Setting up token refresh - expiresIn: ${expiresIn}, refreshThreshold: ${SDK_CONFIG.refreshThreshold}, refreshIn: ${(expiresIn * 1000) - SDK_CONFIG.refreshThreshold}`);

    this.clearRefreshTokenTimeout();
    const timeout = (expiresIn * 1000) - SDK_CONFIG.refreshThreshold;
    
    this.refreshTokenTimeout = setTimeout(() => {
      debugLog('ApiClient: Refresh timeout triggered, attempting refresh');
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
  async refreshToken(): Promise<TokenResponse> {
    try {
      debugLog('ApiClient: Starting token refresh');

      const response = await this.auth.authControllerRefresh({
        refresh_token: 'dummy', // The actual token is sent via cookie
      });

      // Cast response data to TokenResponse
      const tokenResponse = response.data as unknown as TokenResponse;
      this.setAccessToken(tokenResponse.access_token);
      this.setupRefreshToken(tokenResponse.expires_in);
      debugLog('ApiClient: Token refresh successful');
      return tokenResponse;
    } catch (error) {
      debugLog('ApiClient: Token refresh failed');
      this.handleRefreshFailure();
      throw error;
    }
  }

  /**
   * Gets the current token payload if valid
   * @returns {any | null} The decoded token payload or null
   */
  getTokenPayload(): any | null {
    const token = this.getAccessToken();
    if (!token) {
      debugLog('ApiClient: No token available for payload');
      return null;
    }

    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = payload.exp - currentTime;
      
      debugLog(`ApiClient: Token payload check - exp: ${payload.exp}, currentTime: ${currentTime}, timeToExpiry: ${timeToExpiry}, isExpired: ${payload.exp <= currentTime}`);

      if (payload.exp <= currentTime) {
        debugLog('ApiClient: Token is expired, triggering refresh');
        this.handleRefreshFailure();
        return null;
      }

      return payload;
    } catch (error) {
      debugLog(`ApiClient: Failed to decode token payload - ${error}`);
      return null;
    }
  }

  /**
   * Handles token refresh failures
   * Clears the current token and refresh timeout
   * Allows auth hook to handle redirect to login
   */
  private handleRefreshFailure() {
    debugLog('ApiClient: Handling refresh failure');
    this.setAccessToken(null);
    this.clearRefreshTokenTimeout();
  }

  /**
   * Clears any existing refresh token timeout
   */
  private clearRefreshTokenTimeout() {
    if (this.refreshTokenTimeout) {
      debugLog('ApiClient: Clearing refresh timeout');
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  /**
   * Resets the client state
   * Clears the access token and refresh timeout
   */
  reset() {
    debugLog('ApiClient: Resetting client state');
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