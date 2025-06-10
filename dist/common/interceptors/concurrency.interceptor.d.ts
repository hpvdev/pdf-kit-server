import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MemoryMonitorService } from '../../services/memory-monitor.service';
export declare class ConcurrencyInterceptor implements NestInterceptor {
    private readonly memoryMonitor;
    constructor(memoryMonitor: MemoryMonitorService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
