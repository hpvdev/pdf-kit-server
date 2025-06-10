export interface MemoryStats {
    used: number;
    free: number;
    total: number;
    usagePercent: number;
}
export declare class MemoryMonitorService {
    private readonly logger;
    private activeConversions;
    private readonly maxConcurrent;
    getMemoryStats(): MemoryStats;
    getActiveConversions(): number;
    getMaxConcurrent(): number;
    canAcceptNewConversion(): boolean;
    incrementActiveConversions(): void;
    decrementActiveConversions(): void;
    logMemoryUsage(): void;
    forceGarbageCollection(): void;
    checkMemoryThreshold(): boolean;
}
