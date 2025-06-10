import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { MemoryMonitorService } from '../../services/memory-monitor.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private memoryMonitor: MemoryMonitorService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const memoryStats = this.memoryMonitor.getMemoryStats();
    
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 8 * 1024 * 1024 * 1024), // 8GB limit
      () => this.memory.checkRSS('memory_rss', 16 * 1024 * 1024 * 1024), // 16GB limit
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.9 // 90% threshold
      }),
      () => Promise.resolve({
        services: {
          status: 'up',
          libreoffice: 'available',
          conversion_engine: 'ready'
        }
      }),
      () => Promise.resolve({
        memory_usage: {
          status: 'up',
          used: `${(memoryStats.used / 1024 / 1024 / 1024).toFixed(1)}GB`,
          free: `${(memoryStats.free / 1024 / 1024 / 1024).toFixed(1)}GB`,
          total: `${(memoryStats.total / 1024 / 1024 / 1024).toFixed(1)}GB`,
          usage_percent: `${memoryStats.usagePercent.toFixed(1)}%`
        }
      }),
      () => Promise.resolve({
        server_info: {
          status: 'up',
          active_conversions: this.memoryMonitor.getActiveConversions(),
          max_concurrent: 3,
          version: '2.0.0',
          timestamp: new Date().toISOString()
        }
      })
    ]);
  }
} 