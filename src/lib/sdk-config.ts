import { Configuration } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';

// Track refresh state
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

// Create SDK configuration with token refresh middleware
export const sdkConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
    middleware: [
        {
            async pre(context) {
                // Get token from cookies
                const token = Cookies.get('accessToken');
                
                // Function to handle token refresh
                const handleRefresh = async () => {
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
                };

                if (token) {
                    try {
                        // Check if token is expired
                        const [, payload] = token.split('.');
                        const decodedPayload = JSON.parse(atob(payload));
                        const isExpired = decodedPayload.exp * 1000 < Date.now();

                        // If token is expired and not refreshing, start refresh
                        if (isExpired) {
                            if (!isRefreshing) {
                                isRefreshing = true;
                                refreshPromise = handleRefresh()
                                    .catch((error) => {
                                        console.error('Token refresh failed:', error);
                                        Cookies.remove('accessToken');
                                        Cookies.remove('refreshToken');
                                        window.location.href = '/auth/login';
                                        throw error;
                                    })
                                    .finally(() => {
                                        isRefreshing = false;
                                        refreshPromise = null;
                                    });
                            }

                            // Wait for ongoing refresh to complete
                            if (refreshPromise) {
                                await refreshPromise;
                            }

                            // Get the new token after refresh
                            const newToken = Cookies.get('accessToken');
                            if (!newToken) {
                                throw new Error('No token after refresh');
                            }

                            // Set the new token in headers
                            context.init.headers = {
                                ...context.init.headers,
                                Authorization: `Bearer ${newToken}`,
                            };
                        } else {
                            // Token is valid, use it
                            context.init.headers = {
                                ...context.init.headers,
                                Authorization: `Bearer ${token}`,
                            };
                        }
                    } catch (error) {
                        console.error('Token handling failed:', error);
                        Cookies.remove('accessToken');
                        Cookies.remove('refreshToken');
                        window.location.href = '/auth/login';
                        throw error;
                    }
                }

                return context;
            }
        }
    ]
}); 