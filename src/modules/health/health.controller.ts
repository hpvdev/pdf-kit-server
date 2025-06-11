import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { MemoryMonitorService } from '../../services/memory-monitor.service';
import { ConversionEngineService } from '../../services/conversion-engine.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private memoryMonitor: MemoryMonitorService,
    private conversionEngine: ConversionEngineService,
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
      async () => {
        const engineInfo = await this.conversionEngine.getEngineInfo();
        const isReady = await this.conversionEngine.isEngineReady();
        
        return {
          services: {
            status: isReady ? 'up' : 'down',
            libreoffice: engineInfo.isAvailable ? 'available' : 'unavailable',
            libreoffice_version: engineInfo.libreOfficeVersion,
            conversion_engine: isReady ? 'ready' : 'not_ready',
            supported_formats: engineInfo.supportedFormats
          }
        };
      },
      () => Promise.resolve({
        memory_usage: {
          status: 'up',
          used: `${(memoryStats.used / 1024 / 1024 / 1024).toFixed(1)}GB`,
          free: `${(memoryStats.free / 1024 / 1024 / 1024).toFixed(1)}GB`,
          total: `${(memoryStats.total / 1024 / 1024 / 1024).toFixed(1)}GB`,
          usage_percent: `${memoryStats.usagePercent.toFixed(1)}%`
        }
      }),
      () => {
        const conversionStats = this.conversionEngine.getConversionStats();
        
        return Promise.resolve({
          server_info: {
            status: 'up',
            active_conversions: conversionStats.activeConversions,
            max_concurrent: conversionStats.maxConcurrentConversions,
            memory_usage_mb: Math.round(conversionStats.memoryUsage / 1024 / 1024),
            version: '2.0.0',
            timestamp: new Date().toISOString()
          }
        });
      }
    ]);
  }
} 