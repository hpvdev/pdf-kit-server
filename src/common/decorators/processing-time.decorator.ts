import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { ProcessingTimeInterceptor } from '../interceptors/processing-time.interceptor';

export const PROCESSING_TIME_KEY = 'processing_time';

/**
 * Decorator to track processing time for endpoints
 * @param trackMemory - Whether to track memory usage as well
 * @param includeHeaders - Whether to include timing headers in response
 */
export function ProcessingTime(trackMemory: boolean = false, includeHeaders: boolean = true) {
  return applyDecorators(
    SetMetadata(PROCESSING_TIME_KEY, { trackMemory, includeHeaders }),
    UseInterceptors(ProcessingTimeInterceptor),
  );
}
