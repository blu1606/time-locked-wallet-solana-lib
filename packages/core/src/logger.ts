/**
 * Simple logger utility for development/production control
 */
export class Logger {
    private static isDevelopment = process.env.NODE_ENV === 'development';

    static debug(...args: any[]) {
        if (this.isDevelopment) {
            console.log('[DEBUG]', ...args);
        }
    }

    static info(...args: any[]) {
        console.log('[INFO]', ...args);
    }

    static warn(...args: any[]) {
        console.warn('[WARN]', ...args);
    }

    static error(...args: any[]) {
        console.error('[ERROR]', ...args);
    }
}
