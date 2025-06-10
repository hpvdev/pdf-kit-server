import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: {}
      }
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        errorResponse = exceptionResponse;
      } else {
        errorResponse = {
          error: {
            code: this.getErrorCode(status),
            message: exceptionResponse || exception.message,
            details: {}
          }
        };
      }
    } else if (exception instanceof Error) {
      // Handle specific error types
      if (exception.message.includes('File too large')) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        errorResponse = {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds the maximum allowed limit',
            details: {
              max_size_mb: 100,
              suggestion: 'Please upload a smaller file'
            }
          }
        };
      } else if (exception.message.includes('timeout')) {
        status = HttpStatus.REQUEST_TIMEOUT;
        errorResponse = {
          error: {
            code: 'CONVERSION_TIMEOUT',
            message: 'Conversion took too long and was terminated',
            details: {
              timeout_seconds: 30,
              suggestion: 'Try with a smaller file or contact support'
            }
          }
        };
      } else {
        errorResponse = {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: exception.message,
            details: {}
          }
        };
      }
    }

    // Add request context for debugging
    errorResponse.error.details = {
      ...errorResponse.error.details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method
    };

    // Log error for monitoring
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
      exception instanceof Error ? exception.stack : 'Unknown error'
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'FILE_TOO_LARGE';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.REQUEST_TIMEOUT:
        return 'CONVERSION_TIMEOUT';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
} 