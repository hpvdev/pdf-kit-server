import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface MobileOptimizedResponse {
  success: boolean;
  data?: any;
  metadata?: {
    processing_time_ms: number;
    timestamp: string;
    request_id?: string;
    server_version: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const processingTime = Date.now() - startTime;
        
        // Skip transformation for binary responses
        if (this.isBinaryResponse(response)) {
          return data;
        }

        // Skip transformation if data is already in the expected format
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Transform response for mobile optimization
        const transformedResponse: MobileOptimizedResponse = {
          success: true,
          data: data,
          metadata: {
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString(),
            request_id: this.generateRequestId(),
            server_version: '2.0.0',
          },
        };

        // Add pagination info if applicable
        if (this.isPaginatedResponse(data)) {
          transformedResponse.pagination = this.extractPaginationInfo(data);
        }

        // Add mobile-specific headers
        this.addMobileHeaders(response, processingTime);

        return transformedResponse;
      }),
    );
  }

  /**
   * Check if response is binary (file download)
   */
  private isBinaryResponse(response: Response): boolean {
    const contentType = response.getHeader('Content-Type')?.toString() || '';
    const contentDisposition = response.getHeader('Content-Disposition')?.toString() || '';
    
    return (
      contentType.includes('application/pdf') ||
      contentType.includes('application/vnd.openxmlformats') ||
      contentType.includes('application/msword') ||
      contentType.includes('application/vnd.ms-') ||
      contentType.includes('application/octet-stream') ||
      contentDisposition.includes('attachment')
    );
  }

  /**
   * Check if response contains pagination data
   */
  private isPaginatedResponse(data: any): boolean {
    return data && typeof data === 'object' && 
           ('page' in data || 'limit' in data || 'total' in data);
  }

  /**
   * Extract pagination information from response data
   */
  private extractPaginationInfo(data: any): MobileOptimizedResponse['pagination'] {
    return {
      page: data.page || 1,
      limit: data.limit || 10,
      total: data.total || 0,
      has_more: data.has_more || false,
    };
  }

  /**
   * Add mobile-specific headers for optimization
   */
  private addMobileHeaders(response: Response, processingTime: number): void {
    // Performance headers
    response.setHeader('X-Processing-Time', processingTime.toString());
    response.setHeader('X-Server-Version', '2.0.0');
    
    // Mobile optimization headers
    response.setHeader('X-Mobile-Optimized', 'true');
    response.setHeader('X-Response-Format', 'json');
    
    // Cache control for mobile apps
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    
    // Security headers for mobile
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
