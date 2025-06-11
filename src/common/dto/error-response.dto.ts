import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailsDto {
  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-07-24T10:00:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path where the error occurred',
    example: '/api/v1/convert',
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method used',
    example: 'POST',
  })
  method: string;

  @ApiProperty({
    description: 'Unique request ID for tracking',
    example: 'err_1627123456789_abc123def',
  })
  request_id: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  })
  user_agent: string;

  @ApiProperty({
    description: 'Indicates if response is mobile optimized',
    example: true,
  })
  mobile_optimized: boolean;

  @ApiProperty({
    description: 'Additional error-specific details',
    example: { max_size_mb: 50, received_size_mb: 75 },
    required: false,
  })
  additional_info?: Record<string, any>;
}

export class ErrorDto {
  @ApiProperty({
    description: 'Error code for programmatic handling',
    example: 'FILE_TOO_LARGE',
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'File size exceeds the maximum allowed limit',
  })
  message: string;

  @ApiProperty({
    description: 'Detailed error information',
    type: ErrorDetailsDto,
  })
  details: ErrorDetailsDto;

  @ApiProperty({
    description: 'Suggested recovery actions for mobile users',
    example: [
      'Reduce file size by compressing the document',
      'Try uploading a smaller file',
      'Check your internet connection'
    ],
    isArray: true,
  })
  recovery_suggestions: string[];
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error information',
    type: ErrorDto,
  })
  error: ErrorDto;

  @ApiProperty({
    description: 'Server metadata',
    example: {
      server_version: '2.0.0',
      processing_time_ms: 150,
      timestamp: '2024-07-24T10:00:00Z'
    },
    required: false,
  })
  metadata?: {
    server_version: string;
    processing_time_ms: number;
    timestamp: string;
  };
}

export class ValidationErrorDto extends ErrorDto {
  @ApiProperty({
    description: 'Field-specific validation errors',
    example: {
      targetFormat: ['targetFormat must be one of: pdf, docx, xlsx, pptx'],
      file: ['file should not be empty']
    },
  })
  validation_errors: Record<string, string[]>;
}

export class ConversionErrorDto extends ErrorDto {
  @ApiProperty({
    description: 'Conversion-specific error information',
    example: {
      source_format: 'pdf',
      target_format: 'docx',
      file_size_mb: 45,
      processing_time_ms: 28500,
      engine_used: 'pdf-analysis-basic'
    },
  })
  conversion_info: {
    source_format?: string;
    target_format?: string;
    file_size_mb?: number;
    processing_time_ms?: number;
    engine_used?: string;
  };
}

export class RateLimitErrorDto extends ErrorDto {
  @ApiProperty({
    description: 'Rate limiting information',
    example: {
      limit: 50,
      remaining: 0,
      reset_time: '2024-07-24T11:00:00Z',
      retry_after_seconds: 3600
    },
  })
  rate_limit_info: {
    limit: number;
    remaining: number;
    reset_time: string;
    retry_after_seconds: number;
  };
}

export class MemoryErrorDto extends ErrorDto {
  @ApiProperty({
    description: 'Memory usage information',
    example: {
      current_usage_percent: 92.5,
      threshold_percent: 85,
      active_conversions: 3,
      max_concurrent: 3
    },
  })
  memory_info: {
    current_usage_percent: number;
    threshold_percent: number;
    active_conversions: number;
    max_concurrent: number;
  };
}
