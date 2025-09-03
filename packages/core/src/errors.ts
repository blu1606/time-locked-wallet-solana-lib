/**
 * Custom error classes for better error handling
 */

export class TimeLockError extends Error {
    constructor(
        message: string,
        public code?: string,
        public cause?: unknown
    ) {
        super(message);
        this.name = 'TimeLockError';
    }
}

export class ValidationError extends TimeLockError {
    constructor(message: string, public field?: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class NetworkError extends TimeLockError {
    constructor(message: string, cause?: unknown) {
        super(message, 'NETWORK_ERROR', cause);
        this.name = 'NetworkError';
    }
}

export class ProgramError extends TimeLockError {
    constructor(message: string, public programCode?: number) {
        super(message, 'PROGRAM_ERROR');
        this.name = 'ProgramError';
    }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
    static handle(error: unknown): TimeLockError {
        if (error instanceof TimeLockError) {
            return error;
        }

        if (error instanceof Error) {
            // Check for common Solana/Anchor errors
            if (error.message.includes('network')) {
                return new NetworkError(error.message, error);
            }
            
            if (error.message.includes('invalid') || error.message.includes('validation')) {
                return new ValidationError(error.message);
            }

            return new TimeLockError(error.message, 'UNKNOWN_ERROR', error);
        }

        return new TimeLockError(String(error), 'UNKNOWN_ERROR', error);
    }

    static formatUserMessage(error: TimeLockError): string {
        switch (error.code) {
            case 'VALIDATION_ERROR':
                return `Lỗi dữ liệu: ${error.message}`;
            case 'NETWORK_ERROR':
                return `Lỗi kết nối: ${error.message}`;
            case 'PROGRAM_ERROR':
                return `Lỗi chương trình: ${error.message}`;
            default:
                return `Đã xảy ra lỗi: ${error.message}`;
        }
    }
}
