import { Configuration } from '@bawes/erp-api-sdk';

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
  localStorage.setItem('access_token', token);
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('access_token');
}

export function createApiConfig(): Configuration {
  return new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_URL,
    accessToken: getAccessToken() || undefined,
  });
}

// Higher-order function to handle token refresh
export function withTokenRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await apiCall();
      resolve(result);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Token expired, redirect to login
        window.location.href = '/auth/login';
      }
      reject(error);
    }
  });
} 