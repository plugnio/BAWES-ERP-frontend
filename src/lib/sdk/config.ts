import { Configuration } from '@bawes/erp-api-sdk';

/**
 * Configuration settings for the SDK
 */
export const SDK_CONFIG = {
  /** Base URL for API requests from environment variables */
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  /** Time in milliseconds before token expiry to trigger refresh (1 minute) */
  refreshThreshold: 60 * 1000,
};

/**
 * Creates a new API configuration instance
 * Sets up base URL and default headers
 * @returns {Configuration} The API configuration instance
 */
export const createConfiguration = () => new Configuration({
  basePath: SDK_CONFIG.baseUrl,
  baseOptions: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
}); 