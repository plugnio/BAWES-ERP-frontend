import { AuthenticationApi } from '@bawes/erp-api-sdk';
import { sdkConfig } from '@/lib/sdk-config';
import Cookies from 'js-cookie';
import axios from 'axios';

const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    expires: 7 // 7 days
};

export interface RegisterParams {
    email: string;
    password: string;
    nameEn: string;
    nameAr: string;
}

// Create auth API instance with the configured middleware
const authApi = new AuthenticationApi(sdkConfig);

export const authService = {
    async login(email: string, password: string) {
        try {
            const response = await authApi.authControllerLogin({ email, password });
            
            const { access_token, refresh_token } = response.data as any;
            
            // Store tokens in cookies
            Cookies.set("accessToken", access_token, cookieOptions);
            Cookies.set("refreshToken", refresh_token, cookieOptions);
            
            return response.data;
        } catch (error: any) {
            // Handle different types of errors silently without console errors
            if (error.response) {
                if (error.response.status === 401) {
                    throw new Error('Invalid credentials');
                }
                
                const message = error.response.data?.message || 
                              error.response.data?.error || 
                              'Login failed. Please try again.';
                throw new Error(message);
            } else if (error.request) {
                throw new Error('No response from server. Please try again.');
            } else {
                throw new Error('Login failed. Please try again.');
            }
        }
    },

    async register(params: RegisterParams) {
        try {
            const response = await authApi.authControllerRegister(params);
            return response.data;
        } catch (error: any) {
            console.error('Registration failed:', error);
            if (error.response) {
                const message = error.response.data?.message || 
                              error.response.data?.error || 
                              'Registration failed';
                throw new Error(message);
            }
            throw new Error('Registration failed');
        }
    },

    async verifyEmail(email: string, code: string) {
        try {
            const response = await authApi.authControllerVerifyEmail({ email, code });
            return response.data;
        } catch (error: any) {
            console.error('Email verification failed:', error);
            if (error.response) {
                const message = error.response.data?.message || 
                              error.response.data?.error || 
                              'Email verification failed';
                throw new Error(message);
            }
            throw new Error('Email verification failed');
        }
    },

    async refreshToken(refreshToken: string) {
        try {
            console.log('Attempting to refresh token');
            const response = await authApi.authControllerRefresh({ refresh_token: refreshToken });
            console.log('Token refresh successful');
            
            const { access_token, refresh_token } = response.data as any;
            
            // Update tokens in cookies
            Cookies.set("accessToken", access_token, cookieOptions);
            Cookies.set("refreshToken", refresh_token, cookieOptions);
            
            return response.data;
        } catch (error: any) {
            console.error('Token refresh failed:', error);
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
            if (error.response) {
                const message = error.response.data?.message || 
                              error.response.data?.error || 
                              'Token refresh failed';
                throw new Error(message);
            }
            throw new Error('Token refresh failed');
        }
    },

    async logout() {
        console.log('Attempting logout');
        const refreshToken = Cookies.get("refreshToken");
        const accessToken = Cookies.get("accessToken");
        
        try {
            if (refreshToken && accessToken) {
                // Make a direct axios call to the logout endpoint
                await axios.post(
                    `${process.env.NEXT_PUBLIC_ERP_API_URL}/auth/logout`,
                    { refresh_token: refreshToken },
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        }
                    }
                );
                console.log('Logout API call successful');
            }
        } catch (error: any) {
            // Log the error but don't throw it
            console.error('Logout API call failed:', error);
        } finally {
            // Always clear local tokens
            console.log('Clearing tokens');
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
        }
    }
}; 