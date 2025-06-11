import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException, Logger } from '@nestjs/common';
import { MemoryMonitorService } from '../../services/memory-monitor.service';

@Injectable()
export class MemoryOverflowGuard implements CanActivate {
  private readonly logger = new Logger(MemoryOverflowGuard.name);

  constructor(private readonly memoryMonitor: MemoryMonitorService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Check memory threshold
    if (!this.memoryMonitor.checkMemoryThreshold()) {
      const memoryStats = this.memoryMonitor.getMemoryStats();
      
      this.logger.warn('Memory overflow protection triggered', {
        memoryUsage: memoryStats,
        requestPath: request.url,
        requestMethod: request.method,
        userAgent: request.headers['user-agent'],
      });

      throw new ServiceUnavailableException({
        error: {
          code: 'MEMORY_OVERFLOW_PROTECTION',
          message: 'Server memory usage is too high. Please try again later.',
          details: {
            current_memory_usage: `${memoryStats.usagePercent.toFixed(1)}%`,
            max_allowed_usage: '85%',
            retry_after_seconds: 60,
            suggestion: 'The server is currently processing many requests. Please wait and try again.',
          },
        },
      });
    }

    // Check if we can accept new conversions
    if (!this.memoryMonitor.canAcceptNewConversion()) {
      const activeConversions = this.memoryMonitor.getActiveConversions();
      const maxConcurrent = this.memoryMonitor.getMaxConcurrent();

      this.logger.warn('Concurrent conversion limit reached', {
        activeConversions,
        maxConcurrent,
        requestPath: request.url,
        requestMethod: request.method,
      });

      throw new ServiceUnavailableException({
        error: {
          code: 'TOO_MANY_CONCURRENT_CONVERSIONS',
          message: 'Server is currently processing the maximum number of conversions.',
          details: {
            active_conversions: activeConversions,
            max_concurrent_conversions: maxConcurrent,
            retry_after_seconds: 30,
            suggestion: 'Please wait for current conversions to complete before starting new ones.',
          },
        },
      });
    }

    return true;
  }
}
