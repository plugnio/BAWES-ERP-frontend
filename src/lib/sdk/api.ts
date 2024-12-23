import {
  Configuration,
  AuthenticationApi,
  PeopleApi,
  PermissionManagementApi,
  RoleManagementApi,
} from '@bawes/erp-api-sdk';
import { SDK_CONFIG, createConfiguration, setTokenAccessor } from './config';
import { debugLog } from '@/lib/debug';

/**
 * Response structure for authentication token operations
 */
interface TokenResponse {
  /** JWT access token */
  accessToken: string;
  /** Token type (e.g. "Bearer") */
  tokenType: string;
  /** Token expiration time in seconds */
  expiresIn: number;
}

/**
 * Token state change event name
 */
const TOKEN_CHANGE_EVENT = 'token-change';

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
  private tokenPayload: any | null = null;
  private tokenChangeListeners: Set<(hasToken: boolean) => void> = new Set();
  private timeUpdateListeners: Set<(timeToExpiry: number) => void> = new Set();
  private refreshPromise: Promise<void> | null = null;
  private currentTimeToExpiry: number = 0;
  private expiryInterval: NodeJS.Timeout | null = null;

  // API service instances
  private readonly services = {
    auth: {} as AuthenticationApi,
    people: {} as PeopleApi,
    permissions: {} as PermissionManagementApi,
    roles: {} as RoleManagementApi,
  };

  // Public getters for API instances
  get auth(): AuthenticationApi { return this.services.auth; }
  get people(): PeopleApi { return this.services.people; }
  get permissions(): PermissionManagementApi { return this.services.permissions; }
  get roles(): RoleManagementApi { return this.services.roles; }

  private constructor() {
    debugLog('ApiClient: Initializing', {
      action: 'init',
      timestamp: new Date().toISOString()
    });
    
    // Set up token accessor before creating configuration
    setTokenAccessor(() => this.accessToken);
    
    this.configuration = createConfiguration();
    this.initializeServices();
  }

  /**
   * Initialize API service instances
   * @private
   */
  private initializeServices() {
    Object.assign(this.services, {
      auth: new AuthenticationApi(this.configuration),
      people: new PeopleApi(this.configuration),
      permissions: new PermissionManagementApi(this.configuration),
      roles: new RoleManagementApi(this.configuration),
    });
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
   * Sets the current access token and updates token state
   * @param {string | null} token - The access token or null to clear
   */
  setAccessToken(token: string | null) {
    const info = {
      hasToken: !!token,
      tokenLength: token?.length || 0
    };
    debugLog('ApiClient: Setting access token', info);
    
    this.accessToken = token;
    this.tokenPayload = null; // Clear cached payload
    
    // Recreate configuration with new token
    this.configuration = createConfiguration();
    this.initializeServices();
    
    // Notify token change listeners
    const hasToken = !!token;
    this.tokenChangeListeners.forEach(listener => listener(hasToken));
  }

  /**
   * Gets the current access token
   * @returns {string | null} The current access token or null if not set
   */
  getAccessToken(): string | null {
    const info = {
      hasToken: !!this.accessToken,
      tokenLength: this.accessToken?.length || 0,
      caller: new Error().stack?.split('\n')[2]?.trim() || 'unknown'
    };
    debugLog('ApiClient: Token access', info);
    return this.accessToken;
  }

  /**
   * Gets the current time to expiry
   * @returns {number} Time to expiry in seconds
   */
  getTimeToExpiry(): number {
    return this.currentTimeToExpiry;
  }

  /**
   * Sets up the access token and refresh timer
   * @param {string} token - The JWT token to parse expiration from
   */
  private setupRefreshToken(token: string) {
    try {
      // Get expiration from JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;
      
      // Schedule refresh 1 minute before expiration
      const refreshIn = Math.max(0, timeUntilExpiry - SDK_CONFIG.refreshThreshold);
      
      const info = {
        action: 'setup_refresh',
        expirationTime: new Date(expirationTime).toISOString(),
        timeUntilExpiry: timeUntilExpiry / 1000,
        refreshIn: refreshIn / 1000,
        willRefreshAt: new Date(now + refreshIn).toISOString()
      };
      debugLog('ApiClient: Setting up token refresh', info);

      this.clearRefreshTokenTimeout();
      
      // Set initial time to expiry
      this.currentTimeToExpiry = Math.floor(timeUntilExpiry / 1000);
      
      // Start expiry countdown
      if (this.expiryInterval) {
        clearInterval(this.expiryInterval);
      }
      
      this.expiryInterval = setInterval(() => {
        const prevTimeToExpiry = this.currentTimeToExpiry;
        this.currentTimeToExpiry = Math.max(0, this.currentTimeToExpiry - 1);
        
        // Notify time update listeners
        if (prevTimeToExpiry !== this.currentTimeToExpiry) {
          this.timeUpdateListeners.forEach(listener => 
            listener(this.currentTimeToExpiry)
          );
        }
      }, 1000);
      
      // Only set up refresh if we have enough time
      if (refreshIn > 0) {
        this.refreshTokenTimeout = setTimeout(() => {
          debugLog('ApiClient: Refresh timeout triggered', {
            action: 'refresh_trigger',
            at: new Date().toISOString()
          });
          this.refreshToken().catch((error) => {
            debugLog('ApiClient: Token refresh failed', {
              error,
              action: 'refresh_error'
            });
            this.handleRefreshFailure();
          });
        }, refreshIn);
      } else {
        debugLog('ApiClient: Token too close to expiration for refresh', {
          action: 'skip_refresh'
        });
      }
    } catch (error) {
      debugLog('ApiClient: Failed to setup token refresh', {
        error,
        action: 'setup_refresh_error'
      });
      this.handleRefreshFailure();
    }
  }

  /**
   * Sets up the access token and refresh timer
   * @param {TokenResponse} response - The token response from auth endpoint
   */
  handleTokenResponse(response: TokenResponse | { access_token: string; expires_in: number }) {
    const info = {
      action: 'handle_token_response',
      hasToken: false,
      expiresIn: 0
    };

    // Check which format we received
    if ('accessToken' in response) {
      info.hasToken = !!response.accessToken;
      info.expiresIn = response.expiresIn;
      
      // Set the access token
      this.setAccessToken(response.accessToken);

      // Setup refresh if we have expiry
      if (response.expiresIn) {
        this.setupRefreshToken(response.accessToken);
      }
    } else {
      info.hasToken = !!response.access_token;
      info.expiresIn = response.expires_in;
      
      // Set the access token
      this.setAccessToken(response.access_token);

      // Setup refresh if we have expiry
      if (response.expires_in) {
        this.setupRefreshToken(response.access_token);
      }
    }

    debugLog('ApiClient: Handling token response', info);
  }

  /**
   * Refreshes the access token
   * Uses a lock to prevent concurrent refresh attempts
   */
  async refreshToken() {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      debugLog('ApiClient: Token refresh in progress, waiting...', {
        action: 'refresh_wait',
        hasExistingPromise: true
      });
      try {
        await this.refreshPromise;
        return;
      } catch (error) {
        debugLog('ApiClient: Waiting for refresh failed', {
          error,
          action: 'refresh_wait_error'
        });
        throw error;
      }
    }

    try {
      // Create new refresh promise and store reference before awaiting
      const promise = (async () => {
        debugLog('ApiClient: Starting token refresh', {
          action: 'refresh_start'
        });
        
        const response = await this.auth.authControllerRefresh({
          refresh_token: 'dummy', // The actual token is sent via cookie
        });
        
        // Cast response data to TokenResponse
        const tokenResponse = response.data as unknown as TokenResponse;
        
        // Handle the token response
        this.handleTokenResponse(tokenResponse);
        
        debugLog('ApiClient: Token refresh completed', {
          action: 'refresh_success',
          expiresIn: tokenResponse.expiresIn
        });
      })();

      // Store the promise before awaiting it
      this.refreshPromise = promise;

      // Wait for refresh to complete
      await promise;
    } catch (error) {
      debugLog('ApiClient: Token refresh failed', {
        error,
        action: 'refresh_error'
      });
      this.handleRefreshFailure();
      throw error;
    } finally {
      // Clear the refresh promise
      this.refreshPromise = null;
    }
  }

  /**
   * Gets the current token payload if valid
   * Uses cached payload if available
   * @returns {any | null} The decoded token payload or null
   */
  getTokenPayload(): any | null {
    // Return cached payload if available
    if (this.tokenPayload) {
      debugLog('ApiClient: Using cached payload', {
        action: 'get_payload_cached'
      });
      return this.tokenPayload;
    }

    const token = this.getAccessToken();
    if (!token) {
      debugLog('ApiClient: No token available for payload', {
        action: 'get_payload_no_token'
      });
      return null;
    }

    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = payload.exp - currentTime;
      
      const info = {
        action: 'check_payload',
        exp: payload.exp,
        currentTime,
        timeToExpiry,
        isExpired: payload.exp <= currentTime
      };
      debugLog('ApiClient: Token payload check', info);

      if (payload.exp <= currentTime) {
        debugLog('ApiClient: Token is expired', {
          action: 'token_expired'
        });
        return null;
      }

      // Cache valid payload
      this.tokenPayload = payload;
      return payload;
    } catch (error) {
      debugLog('ApiClient: Failed to decode token payload', {
        error,
        action: 'decode_error'
      });
      return null;
    }
  }

  /**
   * Subscribes to token changes
   * @param callback Function to call when token changes
   * @returns Function to unsubscribe
   */
  onTokenChange(callback: (hasToken: boolean) => void): () => void {
    this.tokenChangeListeners.add(callback);
    // Initial callback with current state
    callback(!!this.accessToken);
    return () => this.tokenChangeListeners.delete(callback);
  }

  /**
   * Subscribes to time to expiry updates
   * @param callback Function to call when time updates
   * @returns Function to unsubscribe
   */
  onTimeUpdate(callback: (timeToExpiry: number) => void): () => void {
    this.timeUpdateListeners.add(callback);
    // Initial callback with current state
    callback(this.currentTimeToExpiry);
    return () => this.timeUpdateListeners.delete(callback);
  }

  /**
   * Handles token refresh failures
   * Clears the current token and refresh timeout
   */
  private handleRefreshFailure() {
    debugLog('ApiClient: Handling refresh failure');
    this.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
    this.currentTimeToExpiry = 0;
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
    this.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
    this.currentTimeToExpiry = 0;
    this.tokenChangeListeners.clear();
    this.timeUpdateListeners.clear();
  }

  /**
   * Sets up the access token and refresh timer
   * @param {string} token - The access token to set
   */
  setupToken(token: string) {
    this.setAccessToken(token);
    this.setupRefreshToken(token);
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