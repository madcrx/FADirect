/**
 * Logger utility for FA Direct mobile app
 * Only logs in development mode
 */

const isDevelopment = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[FA Direct]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[FA Direct][INFO]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[FA Direct][WARN]', ...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error('[FA Direct][ERROR]', ...args);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[FA Direct][DEBUG]', ...args);
    }
  },

  api: {
    request: (method: string, url: string, data?: any) => {
      if (isDevelopment) {
        console.log(`[FA Direct][API] 📤 ${method} ${url}`, data || '');
      }
    },

    response: (method: string, url: string, status: number, data?: any) => {
      if (isDevelopment) {
        const emoji = status >= 200 && status < 300 ? '✅' : '❌';
        console.log(`[FA Direct][API] 📥 ${emoji} ${method} ${url} [${status}]`);
      }
    },

    error: (method: string, url: string, error: any) => {
      // Always log API errors
      console.error(`[FA Direct][API] ❌ ${method} ${url}`, error);
    },
  },
};

export default logger;
