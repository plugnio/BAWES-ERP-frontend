import { Configuration } from '@bawes/erp-api-sdk';
import Cookies from 'js-cookie';
import axios from 'axios';

export function isTokenExpired(token: string): boolean {
    try {
        const [, payload] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        // Add 30-second buffer to prevent edge cases
        return (decodedPayload.exp * 1000) - 30000 <= Date.now();
    } catch (error) {
        return true;
    }
}

export async function refreshAccessToken(): Promise<string> {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_ERP_API_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                }
            }
        );

        const { access_token, refresh_token } = response.data;
        Cookies.set('accessToken', access_token, { path: '/' });
        Cookies.set('refreshToken', refresh_token, { path: '/' });
        return access_token;
    } catch (error) {
        Cookies.remove('accessToken', { path: '/' });
        Cookies.remove('refreshToken', { path: '/' });
        throw new Error('Token refresh failed');
    }
}

export async function ensureValidToken(): Promise<void> {
    const token = Cookies.get('accessToken');
    if (!token) {
        throw new Error('No access token available');
    }

    if (isTokenExpired(token)) {
        await refreshAccessToken();
    }
}

// Create SDK configuration
export const sdkConfig = new Configuration({
    basePath: process.env.NEXT_PUBLIC_ERP_API_URL || 'http://localhost:3000',
    baseOptions: {
        headers: {
            'Content-Type': 'application/json',
        }
    },
    accessToken: () => {
        const token = Cookies.get('accessToken');
        if (!token) {
            throw new Error('No access token available');
        }
        return `Bearer ${token}`;
    }
}); 