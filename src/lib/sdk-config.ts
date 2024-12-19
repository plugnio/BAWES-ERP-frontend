import { Configuration } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';

// Track refresh state
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function handleTokenRefresh() {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const { authService } = await import('@/services/authService');
    await authService.refreshToken(refreshToken);
    
    const newToken = Cookies.get('accessToken');
    if (!newToken) {
        throw new Error('No new token after refresh');
    }
    
    return newToken;
}

// Create SDK configuration with token refresh middleware
export const sdkConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
    middleware: [
        {
            async pre(context) {
                // Skip token handling for auth endpoints
                if (context.url.includes('/auth/login') || 
                    context.url.includes('/auth/register') ||
                    context.url.includes('/auth/refresh')) {
                    return context;
                }

                let token = Cookies.get('accessToken');
                
                if (!token) {
                    window.location.href = '/auth/login';
                    throw new Error('No access token');
                }

                try {
                    // Check if token is expired
                    const [, payload] = token.split('.');
                    const decodedPayload = JSON.parse(atob(payload));
                    const isExpired = decodedPayload.exp * 1000 <= Date.now();

                    // If token is expired, try to refresh
                    if (isExpired) {
                        // If already refreshing, wait for it
                        if (refreshPromise) {
                            await refreshPromise;
                            token = Cookies.get('accessToken');
                        } else {
                            // Start new refresh
                            isRefreshing = true;
                            refreshPromise = handleTokenRefresh()
                                .finally(() => {
                                    isRefreshing = false;
                                    refreshPromise = null;
                                });

                            await refreshPromise;
                            token = Cookies.get('accessToken');
                        }

                        if (!token) {
                            Cookies.remove('accessToken');
                            Cookies.remove('refreshToken');
                            window.location.href = '/auth/login';
                            throw new Error('No token after refresh');
                        }
                    }

                    // Set the token in headers
                    context.init.headers = {
                        ...context.init.headers,
                        Authorization: `Bearer ${token}`,
                    };

                    return context;
                } catch (error) {
                    // Only redirect to login if we're not already refreshing
                    if (!isRefreshing) {
                        Cookies.remove('accessToken');
                        Cookies.remove('refreshToken');
                        window.location.href = '/auth/login';
                    }
                    throw error;
                }
            }
        }
    ]
}); 