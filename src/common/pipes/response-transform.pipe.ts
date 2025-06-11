import { PipeTransform, Injectable, ArgumentMetadata, Logger } from '@nestjs/common';

export interface MobileResponseMetadata {
  processing_time_ms: number;
  timestamp: string;
  server_version: string;
  request_id: string;
  mobile_optimized: boolean;
}

export interface MobileOptimizedResponse<T = any> {
  success: boolean;
  data: T;
  metadata: MobileResponseMetadata;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

@Injectable()
export class ResponseTransformPipe implements PipeTransform {
  private readonly logger = new Logger(ResponseTransformPipe.name);

  transform(value: any, metadata: ArgumentMetadata): any {
    // Skip transformation for certain types
    if (this.shouldSkipTransformation(value, metadata)) {
      return value;
    }

    // If already transformed, return as-is
    if (this.isAlreadyTransformed(value)) {
      return value;
    }

    // Transform the response
    return this.transformResponse(value);
  }

  /**
   * Check if transformation should be skipped
   */
  private shouldSkipTransformation(value: any, metadata: ArgumentMetadata): boolean {
    // Skip for binary data (Buffer)
    if (Buffer.isBuffer(value)) {
      return true;
    }

    // Skip for error responses
    if (value && typeof value === 'object' && 'error' in value) {
      return true;
    }

    // Skip for health check responses (they have their own format)
    if (value && typeof value === 'object' && 'status' in value && 'info' in value) {
      return true;
    }

    // Skip for file streams or binary responses
    if (value && typeof value === 'object' && value.constructor && 
        (value.constructor.name === 'ReadStream' || value.constructor.name === 'FileStream')) {
      return true;
    }

    return false;
  }

  /**
   * Check if response is already transformed
   */
  private isAlreadyTransformed(value: any): boolean {
    return value && 
           typeof value === 'object' && 
           'success' in value && 
           'metadata' in value &&
           'mobile_optimized' in (value.metadata || {});
  }

  /**
   * Transform response to mobile-optimized format
   */
  private transformResponse(data: any): MobileOptimizedResponse {
    const metadata: MobileResponseMetadata = {
      processing_time_ms: Date.now(), // This should be set by interceptor
      timestamp: new Date().toISOString(),
      server_version: '2.0.0',
      request_id: this.generateRequestId(),
      mobile_optimized: true,
    };

    const response: MobileOptimizedResponse = {
      success: true,
      data: data,
      metadata: metadata,
    };

    // Add pagination if data contains pagination info
    if (this.hasPaginationInfo(data)) {
      response.pagination = this.extractPaginationInfo(data);
    }

    return response;
  }

  /**
   * Check if data contains pagination information
   */
  private hasPaginationInfo(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           (('page' in data && 'limit' in data) || 
            ('offset' in data && 'limit' in data) ||
            ('current_page' in data && 'per_page' in data));
  }

  /**
   * Extract pagination information from data
   */
  private extractPaginationInfo(data: any): MobileOptimizedResponse['pagination'] {
    // Handle different pagination formats
    if ('page' in data && 'limit' in data) {
      return {
        page: data.page || 1,
        limit: data.limit || 10,
        total: data.total || 0,
        has_more: data.has_more || false,
      };
    }

    if ('current_page' in data && 'per_page' in data) {
      return {
        page: data.current_page || 1,
        limit: data.per_page || 10,
        total: data.total || 0,
        has_more: (data.current_page * data.per_page) < (data.total || 0),
      };
    }

    if ('offset' in data && 'limit' in data) {
      const page = Math.floor((data.offset || 0) / (data.limit || 10)) + 1;
      return {
        page: page,
        limit: data.limit || 10,
        total: data.total || 0,
        has_more: ((data.offset || 0) + (data.limit || 10)) < (data.total || 0),
      };
    }

    return {
      page: 1,
      limit: 10,
      total: 0,
      has_more: false,
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

@Injectable()
export class FileResponsePipe implements PipeTransform {
  private readonly logger = new Logger(FileResponsePipe.name);

  transform(value: any, metadata: ArgumentMetadata): any {
    // This pipe is specifically for file conversion responses
    if (!this.isFileConversionResponse(value)) {
      return value;
    }

    // Add mobile-specific headers information to the response
    if (value && typeof value === 'object' && 'buffer' in value) {
      return {
        ...value,
        mobile_optimized: true,
        download_info: {
          supports_resume: false, // Mobile apps might want to know this
          chunk_size_recommended: 1024 * 1024, // 1MB chunks for mobile
          compression_applied: false, // Binary files are not compressed
        },
      };
    }

    return value;
  }

  private isFileConversionResponse(value: any): boolean {
    return value && 
           typeof value === 'object' && 
           ('buffer' in value || 'data' in value) &&
           ('filename' in value || 'content_type' in value);
  }
}

@Injectable()
export class ErrorResponsePipe implements PipeTransform {
  private readonly logger = new Logger(ErrorResponsePipe.name);

  transform(value: any, metadata: ArgumentMetadata): any {
    // This pipe handles error response transformation
    if (!this.isErrorResponse(value)) {
      return value;
    }

    // Ensure error responses have mobile-friendly structure
    return {
      success: false,
      ...value,
      metadata: {
        ...value.metadata,
        mobile_optimized: true,
        error_handled: true,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private isErrorResponse(value: any): boolean {
    return value && 
           typeof value === 'object' && 
           'error' in value &&
           !('success' in value);
  }
}
