import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MemoryMonitorService } from '../../services/memory-monitor.service';
import { ConversionEngineService } from '../../services/conversion-engine.service';

@ApiTags('health')
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
  @ApiOperation({
    summary: 'Health check endpoint',
    description: `
      Comprehensive health check for the PDF Kit Server.

      **Checks performed:**
      - Memory usage (heap and RSS)
      - Disk storage availability
      - LibreOffice service status
      - Conversion engine readiness
      - Active conversion statistics

      **Response codes:**
      - 200: All services healthy
      - 503: One or more services unhealthy
    `
  })
  @ApiResponse({
    status: 200,
    description: 'All services are healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            memory_heap: { type: 'object' },
            memory_rss: { type: 'object' },
            storage: { type: 'object' },
            services: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                libreoffice: { type: 'string', example: 'available' },
                libreoffice_version: { type: 'string', example: '7.0.4.2' },
                conversion_engine: { type: 'string', example: 'ready' },
                supported_formats: { type: 'array', items: { type: 'string' } }
              }
            },
            memory_usage: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                used: { type: 'string', example: '1.2GB' },
                free: { type: 'string', example: '6.8GB' },
                total: { type: 'string', example: '8.0GB' },
                usage_percent: { type: 'string', example: '15.0%' }
              }
            },
            server_info: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'up' },
                active_conversions: { type: 'number', example: 2 },
                max_concurrent: { type: 'number', example: 3 },
                memory_usage_mb: { type: 'number', example: 512 },
                version: { type: 'string', example: '2.0.0' },
                timestamp: { type: 'string', example: '2024-07-24T10:00:00.000Z' }
              }
            }
          }
        },
        error: { type: 'object' },
        details: { type: 'object' }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'One or more services are unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        info: { type: 'object' },
        error: {
          type: 'object',
          properties: {
            services: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'down' },
                message: { type: 'string', example: 'LibreOffice service is not available' }
              }
            }
          }
        },
        details: { type: 'object' }
      }
    }
  })
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