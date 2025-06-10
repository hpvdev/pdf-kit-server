import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 30000) { // 30 seconds default
    this.timeoutMs = timeoutMs;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException({
            error: {
              code: 'CONVERSION_TIMEOUT',
              message: 'Conversion took too long and was terminated',
              details: {
                timeout_seconds: this.timeoutMs / 1000,
                suggestion: 'Try with a smaller file or lower quality setting'
              }
            }
          }));
        }
        return throwError(() => err);
      }),
    );
  }
} 