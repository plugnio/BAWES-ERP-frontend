import { Configuration } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';

// Track refresh state
let isRefreshing = false;

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
                if (token) {
                    // Always set the Authorization header if we have a token
                    context.init.headers = {
                        ...context.init.headers,
                        Authorization: `Bearer ${token}`,
                    };

                    // Only attempt token refresh for non-auth endpoints
                    if (!context.url.includes('/auth/')) {
                        try {
                            const [, payload] = token.split('.');
                            const decodedPayload = JSON.parse(atob(payload));
                            const isExpired = decodedPayload.exp * 1000 < Date.now();

                            if (isExpired && !isRefreshing) {
                                isRefreshing = true;
                                try {
                                    const refreshToken = Cookies.get('refreshToken');
                                    if (refreshToken) {
                                        const { authService } = await import('@/services/authService');
                                        await authService.refreshToken(refreshToken);
                                        
                                        // Get the new token after refresh
                                        const newToken = Cookies.get('accessToken');
                                        if (newToken) {
                                            context.init.headers.Authorization = `Bearer ${newToken}`;
                                        }
                                    }
                                } finally {
                                    isRefreshing = false;
                                }
                            }
                        } catch (error) {
                            console.error('Token refresh failed:', error);
                            Cookies.remove('accessToken');
                            Cookies.remove('refreshToken');
                        }
                    }
                }
                return context;
            }
        }
    ]
}); 