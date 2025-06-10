import { HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { MemoryMonitorService } from '../../services/memory-monitor.service';
export declare class HealthController {
    private health;
    private memory;
    private disk;
    private memoryMonitor;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, disk: DiskHealthIndicator, memoryMonitor: MemoryMonitorService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
