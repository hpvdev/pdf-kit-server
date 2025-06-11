import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { PROCESSING_TIME_KEY } from '../decorators/processing-time.decorator';

export interface ProcessingTimeMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore?: NodeJS.MemoryUsage;
  memoryAfter?: NodeJS.MemoryUsage;
  memoryDelta?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

@Injectable()
export class ProcessingTimeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ProcessingTimeInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Get decorator metadata
    const options = this.reflector.get(PROCESSING_TIME_KEY, context.getHandler()) || {};
    const { trackMemory = false, includeHeaders = true } = options;

    const startTime = Date.now();
    const memoryBefore = trackMemory ? process.memoryUsage() : undefined;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const memoryAfter = trackMemory ? process.memoryUsage() : undefined;

        // Calculate memory delta if tracking memory
        let memoryDelta;
        if (memoryBefore && memoryAfter) {
          memoryDelta = {
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            external: memoryAfter.external - memoryBefore.external,
            rss: memoryAfter.rss - memoryBefore.rss,
          };
        }

        const metrics: ProcessingTimeMetrics = {
          startTime,
          endTime,
          duration,
          memoryBefore,
          memoryAfter,
          memoryDelta,
        };

        // Add headers if requested
        if (includeHeaders) {
          this.addTimingHeaders(response, metrics);
        }

        // Log metrics for monitoring
        this.logMetrics(request, metrics);
      }),
    );
  }

  /**
   * Add timing headers to response
   */
  private addTimingHeaders(response: Response, metrics: ProcessingTimeMetrics): void {
    response.setHeader('X-Processing-Time-Ms', metrics.duration.toString());
    response.setHeader('X-Processing-Start', new Date(metrics.startTime).toISOString());
    response.setHeader('X-Processing-End', new Date(metrics.endTime).toISOString());

    if (metrics.memoryDelta) {
      response.setHeader('X-Memory-Delta-Heap', metrics.memoryDelta.heapUsed.toString());
      response.setHeader('X-Memory-Delta-RSS', metrics.memoryDelta.rss.toString());
    }
  }

  /**
   * Log processing metrics for monitoring
   */
  private logMetrics(request: any, metrics: ProcessingTimeMetrics): void {
    const { method, url, ip } = request;
    const logData = {
      method,
      url,
      ip,
      duration: metrics.duration,
      timestamp: new Date(metrics.startTime).toISOString(),
    };

    // Add memory info if available
    if (metrics.memoryDelta) {
      Object.assign(logData, {
        memoryDelta: {
          heapUsed: `${(metrics.memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          rss: `${(metrics.memoryDelta.rss / 1024 / 1024).toFixed(2)}MB`,
        },
      });
    }

    // Log with appropriate level based on duration
    if (metrics.duration > 10000) { // > 10 seconds
      this.logger.warn('Slow request detected', logData);
    } else if (metrics.duration > 5000) { // > 5 seconds
      this.logger.log('Request completed (slow)', logData);
    } else {
      this.logger.debug('Request completed', logData);
    }
  }
}
