export const DEBUG_CONFIG = {
  /** Whether debug mode is enabled */
  isEnabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
};

/**
 * Logs debug information only when debug mode is enabled
 * @param message The message to log
 * @param data Additional data to log
 */
export const debugLog = (message: string, ...data: unknown[]) => {
  if (DEBUG_CONFIG.isEnabled) {
    // Use console.log instead of console.warn to avoid stack traces
    console.log(`[DEBUG] ${message}`, ...data);
  }
}; 