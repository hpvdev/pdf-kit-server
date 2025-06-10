export class ConversionResponseDto {
  success: boolean;
  filename: string;
  content_type: string;
  file_size: number;
  data?: string; // Base64 data (only for base64 response format)
  processing_time_ms: number;
  engine_used: string;
}

export class ConversionErrorDto {
  error: {
    code: string;
    message: string;
    details: {
      timestamp: string;
      path: string;
      method: string;
      [key: string]: any;
    };
  };
} 