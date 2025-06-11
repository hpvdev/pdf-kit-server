import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { MemoryMonitorService } from '../../services/memory-monitor.service';
import { ConversionEngineService } from '../../services/conversion-engine.service';
export declare class HealthController {
    private health;
    private memory;
    private disk;
    private memoryMonitor;
    private conversionEngine;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, memoryMonitor: MemoryMonitorService, conversionEngine: ConversionEngineService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
