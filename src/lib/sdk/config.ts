import { Configuration } from '@bawes/erp-api-sdk';

export const SDK_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  refreshThreshold: 60 * 1000, // Refresh 1 minute before expiry
};

export const createConfiguration = () => new Configuration({
  basePath: SDK_CONFIG.baseUrl,
  baseOptions: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
}); 