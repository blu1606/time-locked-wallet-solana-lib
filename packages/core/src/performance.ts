/**
 * Performance monitoring utilities
 */

export class PerformanceMonitor {
    private static timers: Map<string, number> = new Map();

    static start(label: string): void {
        this.timers.set(label, performance.now());
    }

    static end(label: string): number {
        const startTime = this.timers.get(label);
        if (!startTime) {
            console.warn(`No timer found for label: ${label}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(label);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    static measure<T>(label: string, fn: () => T): T;
    static measure<T>(label: string, fn: () => Promise<T>): Promise<T>;
    static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
        this.start(label);
        
        try {
            const result = fn();
            
            if (result instanceof Promise) {
                return result.finally(() => {
                    this.end(label);
                });
            } else {
                this.end(label);
                return result;
            }
        } catch (error) {
            this.end(label);
            throw error;
        }
    }

    static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
        this.start(label);
        try {
            const result = await fn();
            this.end(label);
            return result;
        } catch (error) {
            this.end(label);
            throw error;
        }
    }
}
