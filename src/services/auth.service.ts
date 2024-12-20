import { BaseService } from './base.service';
import type { LoginDto, RegisterDto, VerifyEmailDto } from '@bawes/erp-api-sdk';
import type { AxiosResponse } from 'axios';

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
}

export interface ProfileResponse {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
}

export class AuthService extends BaseService {
  private refreshTokenTimeout?: NodeJS.Timeout;
  private currentUser: ProfileResponse | null = null;

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

  async register(registerDto: RegisterDto) {
    try {
      const response = await this.client.auth.authControllerRegister(registerDto);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      const response = await this.client.auth.authControllerVerifyEmail(verifyEmailDto);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

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

  async getCurrentUser(): Promise<ProfileResponse> {
    try {
      if (!this.currentUser) {
        throw new Error('User is not logged in');
      }
      return this.currentUser;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

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

  private handleRefreshFailure() {
    this.client.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    this.currentUser = null;
    // Redirect to login or show session expired message
  }

  private clearRefreshTokenTimeout() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }
} 