import {
  Configuration,
  AuthenticationApi,
  PeopleApi,
  PermissionManagementApi,
  RoleManagementApi,
} from '@bawes/erp-api-sdk';
import { SDK_CONFIG, createConfiguration } from './config';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

class ApiClient {
  private static instance: ApiClient;
  private configuration: Configuration;
  private accessToken: string | null = null;
  private refreshTokenTimeout?: NodeJS.Timeout;

  // API instances
  readonly auth: AuthenticationApi;
  readonly people: PeopleApi;
  readonly permissions: PermissionManagementApi;
  readonly roles: RoleManagementApi;

  private constructor() {
    this.configuration = createConfiguration();

    // Initialize API instances
    this.auth = new AuthenticationApi(this.configuration);
    this.people = new PeopleApi(this.configuration);
    this.permissions = new PermissionManagementApi(this.configuration);
    this.roles = new RoleManagementApi(this.configuration);
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

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

  private handleRefreshFailure() {
    this.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    // Redirect to login will be handled by the auth hook
  }

  private clearRefreshTokenTimeout() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  reset() {
    this.accessToken = null;
    this.clearRefreshTokenTimeout();
  }
}

export const getApiClient = () => ApiClient.getInstance();
export const resetApiClient = () => {
  const client = ApiClient.getInstance();
  client.reset();
}; 