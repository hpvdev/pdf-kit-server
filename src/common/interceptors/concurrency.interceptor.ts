import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { MemoryMonitorService } from '../../services/memory-monitor.service';

@Injectable()
export class ConcurrencyInterceptor implements NestInterceptor {
  constructor(private readonly memoryMonitor: MemoryMonitorService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if we can accept new conversion
    if (!this.memoryMonitor.canAcceptNewConversion()) {
      throw new HttpException(
        {
          error: {
            code: 'TOO_MANY_CONCURRENT_REQUESTS',
            message: 'Server is currently processing the maximum number of concurrent conversions. Please try again later.',
            details: {
              active_conversions: this.memoryMonitor.getActiveConversions(),
              max_concurrent: this.memoryMonitor.getMaxConcurrent(),
              retry_after_seconds: 30
            }
          }
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Check memory threshold before processing
    if (!this.memoryMonitor.checkMemoryThreshold()) {
      throw new HttpException(
        {
          error: {
            code: 'MEMORY_THRESHOLD_EXCEEDED',
            message: 'Server memory usage is too high. Please try again later.',
            details: {
              memory_usage: this.memoryMonitor.getMemoryStats(),
              retry_after_seconds: 60
            }
          }
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // Increment active conversions
    this.memoryMonitor.incrementActiveConversions();
    this.memoryMonitor.logMemoryUsage();

    return next.handle().pipe(
      catchError((error) => {
        // Decrement on error
        this.memoryMonitor.decrementActiveConversions();
        return throwError(() => error);
      }),
      finalize(() => {
        // Decrement active conversions when done
        this.memoryMonitor.decrementActiveConversions();
        
        // Force garbage collection after each conversion
        this.memoryMonitor.forceGarbageCollection();
        
        this.memoryMonitor.logMemoryUsage();
      })
    );
  }
} 