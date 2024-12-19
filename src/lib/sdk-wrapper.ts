import { Configuration, AuthenticationApi } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const config = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL,
    apiKey: process.env.NEXT_PUBLIC_ERP_API_KEY,
});

const authApi = new AuthenticationApi(config);

export const handleTokenRefresh = async () => {
    // If already refreshing, wait for that to complete
    if (refreshPromise) {
        return refreshPromise;
    }

    // If no refresh token, can't refresh
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        isRefreshing = true;
        refreshPromise = (async () => {
            const response = await authApi.authControllerRefresh({ refresh_token: refreshToken });
            Cookies.set('accessToken', response.data.accessToken);
            Cookies.set('refreshToken', response.data.refreshToken);
        })();

        await refreshPromise;
    } catch (error) {
        // If refresh fails, clear cookies and redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        throw error;
    } finally {
        isRefreshing = false;
        refreshPromise = null;
    }
};

// Wrapper for SDK API calls
export const withTokenRefresh = async <T>(
    apiCall: () => Promise<T>
): Promise<T> => {
    try {
        return await apiCall();
    } catch (error: any) {
        // Check if error is due to token expiration
        if (error?.response?.status === 401) {
            // Try to refresh token
            await handleTokenRefresh();
            // Retry the original call
            return await apiCall();
        }
        throw error;
    }
};

// Example usage in a service:
/*
export const someService = {
    async getData() {
        return withTokenRefresh(() => api.someEndpoint());
    }
}
*/ 