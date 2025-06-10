import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../config/multer.config';
import { ConcurrencyInterceptor } from '../interceptors/concurrency.interceptor';
import { TimeoutInterceptor } from '../interceptors/timeout.interceptor';

export function ApiFile(fieldName: string = 'file') {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, multerConfig),
      ConcurrencyInterceptor,
      new TimeoutInterceptor(30000) // 30 seconds timeout
    ),
  );
} 