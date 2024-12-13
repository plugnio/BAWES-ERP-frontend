import { Configuration, AuthenticationApi } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';

const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL,
    apiKey: process.env.NEXT_PUBLIC_ERP_API_KEY
});

const authApi = new AuthenticationApi(config);

// Cookie options for better security
const cookieOptions = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    expires: 7, // 7 days
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
            Cookies.set("accessToken", response.data.access_token, cookieOptions);
            Cookies.set("refreshToken", response.data.refresh_token, cookieOptions);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async register({ email, password, nameEn, nameAr }: RegisterParams) {
        try {
            const response = await authApi.authControllerRegister({
                email,
                password,
                nameEn,
                nameAr
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async verifyEmail(email: string, code: string) {
        try {
            const response = await authApi.authControllerVerifyEmail({ email, code });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async refreshToken(refreshToken: string) {
        try {
            const response = await authApi.authControllerRefresh({ refreshToken });
            Cookies.set("accessToken", response.data.access_token, cookieOptions);
            Cookies.set("refreshToken", response.data.refresh_token, cookieOptions);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        try {
            const refreshToken = Cookies.get("refreshToken");
            if (refreshToken) {
                await authApi.authControllerLogout({ refreshToken });
            }
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
        } catch (error) {
            throw error;
        }
    }
}; 