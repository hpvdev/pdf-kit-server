import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto, ValidationErrorDto, ConversionErrorDto, RateLimitErrorDto, MemoryErrorDto } from '../dto/error-response.dto';

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

      // Handle different response types from NestJS
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Check if it's already in our error format
        if ('error' in exceptionResponse) {
          errorResponse = exceptionResponse as any;
        } else if ('message' in exceptionResponse) {
          // Handle NestJS validation error format
          errorResponse = {
            error: {
              code: this.getErrorCode(status),
              message: Array.isArray((exceptionResponse as any).message)
                ? (exceptionResponse as any).message.join(', ')
                : (exceptionResponse as any).message,
              details: exceptionResponse
            }
          };
        } else {
          errorResponse = {
            error: {
              code: this.getErrorCode(status),
              message: exception.message,
              details: exceptionResponse
            }
          };
        }
      } else {
        // Handle string responses
        errorResponse = {
          error: {
            code: this.getErrorCode(status),
            message: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
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

    // Ensure errorResponse has the correct structure
    if (!errorResponse.error) {
      errorResponse.error = {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: {}
      };
    }

    // Add request context and mobile-specific information
    errorResponse.error.details = {
      ...errorResponse.error.details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      request_id: this.generateRequestId(),
      user_agent: request.headers['user-agent'] || 'unknown',
      mobile_optimized: true,
    };

    // Add mobile-specific error recovery suggestions
    errorResponse.error.recovery_suggestions = this.getMobileRecoverySuggestions(status, exception);

    // Ensure response has success field and metadata
    const finalResponse: ErrorResponseDto = {
      success: false,
      error: errorResponse.error,
      metadata: {
        server_version: '2.0.0',
        processing_time_ms: Date.now() - (request['startTime'] || Date.now()),
        timestamp: new Date().toISOString(),
      }
    };

    // Log error for monitoring
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(finalResponse)}`,
      exception instanceof Error ? exception.stack : 'Unknown error'
    );

    response.status(status).json(finalResponse);
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

  /**
   * Generate a unique request ID for error tracking
   */
  private generateRequestId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get mobile-specific recovery suggestions based on error type
   */
  private getMobileRecoverySuggestions(status: number, exception: unknown): string[] {
    const suggestions: string[] = [];

    switch (status) {
      case HttpStatus.PAYLOAD_TOO_LARGE:
        suggestions.push(
          'Reduce file size by compressing the document',
          'Split large documents into smaller parts',
          'Use a different file format if possible',
          'Check your internet connection stability'
        );
        break;

      case HttpStatus.REQUEST_TIMEOUT:
        suggestions.push(
          'Try again with a smaller file',
          'Check your internet connection',
          'Ensure the app is running in the foreground',
          'Contact support if the issue persists'
        );
        break;

      case HttpStatus.TOO_MANY_REQUESTS:
        suggestions.push(
          'Wait a few minutes before trying again',
          'Reduce the number of simultaneous conversions',
          'Consider upgrading to a premium plan'
        );
        break;

      case HttpStatus.BAD_REQUEST:
        suggestions.push(
          'Check that the file format is supported',
          'Ensure the file is not corrupted',
          'Verify all required parameters are provided',
          'Try uploading the file again'
        );
        break;

      case HttpStatus.SERVICE_UNAVAILABLE:
        suggestions.push(
          'The service is temporarily unavailable',
          'Try again in a few minutes',
          'Check the app status page',
          'Contact support if the issue continues'
        );
        break;

      default:
        suggestions.push(
          'Try the operation again',
          'Restart the app if the problem persists',
          'Check your internet connection',
          'Contact support with the error details'
        );
        break;
    }

    return suggestions;
  }
}