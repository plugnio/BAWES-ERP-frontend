import { Configuration } from '@bawes/erp-api-sdk';

/**
 * Configuration settings for the SDK
 */
export const SDK_CONFIG = {
  /** Base URL for API requests from environment variables */
  baseUrl: process.env.NEXT_PUBLIC_ERP_API_URL,
  /** Time in milliseconds before token expiry to trigger refresh (1 minute) */
  refreshThreshold: 60 * 1000,
};

// Token accessor function that will be set by ApiClient
let getTokenFn: (() => string | null) | null = null;

/**
 * Sets the function used to get the current access token
 * Called by ApiClient during initialization
 */
export const setTokenAccessor = (fn: () => string | null) => {
  getTokenFn = fn;
};

/**
 * Creates a new API configuration instance
 * Sets up base URL and default headers
 * @returns {Configuration} The API configuration instance
 */
export const createConfiguration = () => {
  const token = getTokenFn?.();
  
  return new Configuration({
    basePath: SDK_CONFIG.baseUrl,
    // Don't set accessToken function, we'll handle it in baseOptions
    baseOptions: {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      withCredentials: true,
    },
  });
};