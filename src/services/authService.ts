import { AuthenticationApi } from '@bawes/erp-api-sdk';
import { sdkConfig, refreshAccessToken } from '@/lib/sdk-config';
import Cookies from 'js-cookie';

const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    expires: 7, // 7 days
    path: '/'
};

export interface RegisterParams {
    email: string;
    password: string;
    nameEn: string;
    nameAr: string;
}

// Create auth API instance
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
            if (error.response?.status === 401) {
                throw new Error('Invalid credentials');
            }
            throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
        }
    },

    async register(params: RegisterParams) {
        try {
            const response = await authApi.authControllerRegister(params);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    async verifyEmail(email: string, code: string) {
        try {
            const response = await authApi.authControllerVerifyEmail({ email, code });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Email verification failed');
        }
    },

    async refreshToken() {
        return refreshAccessToken();
    },

    async logout() {
        try {
            const refreshToken = Cookies.get('refreshToken');
            if (refreshToken) {
                await authApi.authControllerLogout({ refresh_token: refreshToken });
            }
        } catch (error) {
            // Ignore errors during logout API call
        } finally {
            this.clearTokens();
        }
    },

    clearTokens() {
        Cookies.remove("accessToken", { path: '/' });
        Cookies.remove("refreshToken", { path: '/' });
    },

    getAccessToken() {
        return Cookies.get('accessToken');
    },

    getRefreshToken() {
        return Cookies.get('refreshToken');
    },

    isAuthenticated() {
        return !!this.getAccessToken();
    }
}; 