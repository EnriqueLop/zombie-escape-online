/**
 * Production-safe logging utility
 * Only logs in development mode, suppresses in production
 */

const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

export const logger = {
    info(message, ...args) {
        if (isDevelopment) {
            console.log(`[INFO] ${message}`, ...args);
        }
    },

    warn(message, ...args) {
        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },

    error(message, error) {
        // Always log errors, but sanitize
        if (error?.code) {
            console.error(`[ERROR] ${message}:`, error.code);
        } else if (error?.message) {
            console.error(`[ERROR] ${message}:`, error.message);
        } else {
            console.error(`[ERROR] ${message}`);
        }
    },

    debug(message, ...args) {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};
