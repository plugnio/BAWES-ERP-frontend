import { Configuration, AuthenticationApi } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';

const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL,
    apiKey: process.env.NEXT_PUBLIC_ERP_API_KEY
});

const authApi = new AuthenticationApi(config);

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

export const authService = {
    async login(email: string, password: string) {
        try {
            const response = await authApi.authControllerLogin({ email, password });
            Cookies.set("accessToken", response.data.accessToken, cookieOptions);
            Cookies.set("refreshToken", response.data.refreshToken, cookieOptions);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            throw new Error(message);
        }
    },

    async register(params: RegisterParams) {
        try {
            const response = await authApi.authControllerRegister(params);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            throw new Error(message);
        }
    },

    async verifyEmail(email: string, code: string) {
        try {
            const response = await authApi.authControllerVerifyEmail({ email, code });
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Email verification failed';
            throw new Error(message);
        }
    },

    async refreshToken(refreshToken: string) {
        try {
            const response = await authApi.authControllerRefresh({ refresh_token: refreshToken });
            Cookies.set("accessToken", response.data.accessToken, cookieOptions);
            Cookies.set("refreshToken", response.data.refreshToken, cookieOptions);
            return response.data;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Token refresh failed';
            throw new Error(message);
        }
    },

    async logout() {
        try {
            const refreshToken = Cookies.get("refreshToken");
            if (refreshToken) {
                await authApi.authControllerLogout({ refresh_token: refreshToken });
            }
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
        } catch (error: any) {
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
            const message = error.response?.data?.message || 'Logout failed';
            throw new Error(message);
        }
    }
}; 