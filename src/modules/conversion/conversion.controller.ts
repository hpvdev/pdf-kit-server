import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Header,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ConversionEngineService } from '../../services/conversion-engine.service';
import { ConvertFileDto } from './dto/convert-file.dto';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import * as multer from 'multer';

@ApiTags('conversion')
@Controller('convert')
export class ConversionController {
  private readonly logger = new Logger(ConversionController.name);

  constructor(private readonly conversionEngine: ConversionEngineService) {}

  @Post()
  @ApiOperation({
    summary: 'Convert between PDF and Office document formats',
    description: `
      Convert documents between PDF and Office formats (DOCX, XLSX, PPTX).

      **Supported conversions:**
      - PDF → DOCX, XLSX, PPTX (max 50MB)
      - DOCX, XLSX, PPTX → PDF (max 100MB)

      **Response formats:**
      - Binary (default): Returns the converted file as binary data
      - Base64: Returns JSON with base64-encoded file data

      **Mobile optimization:**
      - Optimized for mobile networks with compression
      - Progress tracking headers
      - Memory-efficient processing
    `
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File conversion request',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to convert (PDF, DOCX, XLSX, PPTX, DOC, XLS, PPT, ODT, ODS, ODP)'
        },
        targetFormat: {
          type: 'string',
          enum: ['pdf', 'docx', 'xlsx', 'pptx'],
          description: 'Target format for conversion'
        },
        responseFormat: {
          type: 'string',
          enum: ['binary', 'base64'],
          default: 'binary',
          description: 'Response format (binary file or base64 JSON)'
        },
        quality: {
          type: 'string',
          enum: ['low', 'standard', 'high'],
          default: 'standard',
          description: 'Conversion quality level'
        },
        preserveFormatting: {
          type: 'boolean',
          default: true,
          description: 'Preserve original formatting when possible'
        },
        timeout: {
          type: 'number',
          default: 30,
          description: 'Conversion timeout in seconds'
        }
      },
      required: ['file', 'targetFormat']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'File converted successfully',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      },
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            filename: { type: 'string', example: 'document-converted-2024-07-24.pdf' },
            content_type: { type: 'string', example: 'application/pdf' },
            file_size: { type: 'number', example: 1024000 },
            data: { type: 'string', description: 'Base64 encoded file data' },
            processing_time_ms: { type: 'number', example: 2500 },
            engine_used: { type: 'string', example: 'libreoffice' },
            conversion_info: {
              type: 'object',
              properties: {
                source_format: { type: 'string', example: 'docx' },
                target_format: { type: 'string', example: 'pdf' },
                original_size: { type: 'number', example: 512000 },
                converted_size: { type: 'number', example: 1024000 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or parameters',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_REQUEST' },
            message: { type: 'string', example: 'Unsupported file type: text/plain' },
            recovery_suggestions: {
              type: 'array',
              items: { type: 'string' },
              example: ['Check that the file format is supported', 'Ensure the file is not corrupted']
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 413,
    description: 'File too large',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'FILE_TOO_LARGE' },
            message: { type: 'string', example: 'File size 75.5MB exceeds limit of 50MB for PDF to Office conversion' },
            recovery_suggestions: {
              type: 'array',
              items: { type: 'string' },
              example: ['Reduce file size by compressing the document', 'Split large documents into smaller parts']
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 422,
    description: 'Conversion failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'CONVERSION_FAILED' },
            message: { type: 'string', example: 'Failed to convert file. Please check file format and try again.' },
            processing_time_ms: { type: 'number', example: 15000 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - server overloaded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'SERVICE_UNAVAILABLE' },
            message: { type: 'string', example: 'Server is currently processing the maximum number of conversions.' },
            recovery_suggestions: {
              type: 'array',
              items: { type: 'string' },
              example: ['Try again in a few minutes', 'Check the app status page']
            }
          }
        }
      }
    }
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max (will be validated dynamically based on conversion type)
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Validate MIME types
        const allowedMimeTypes = [
          // PDF format
          'application/pdf', // .pdf
          // Office formats
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/msword', // .doc
          'application/vnd.ms-excel', // .xls
          'application/vnd.ms-powerpoint', // .ppt
          // OpenDocument formats
          'application/vnd.oasis.opendocument.text', // .odt
          'application/vnd.oasis.opendocument.spreadsheet', // .ods
          'application/vnd.oasis.opendocument.presentation', // .odp
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async convertFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() convertDto: ConvertFileDto,
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    
    try {
      // Validate file upload
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file size based on conversion type
      this.validateFileSize(file, convertDto.targetFormat);

      this.logger.log(`Starting conversion: ${file.originalname} (${file.size} bytes) -> ${convertDto.targetFormat}`);

      // Prepare conversion request
      const conversionRequest = {
        buffer: file.buffer,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        targetFormat: convertDto.targetFormat,
        options: {
          quality: convertDto.quality || 'standard',
          timeout: convertDto.timeout,
          preserveFormatting: convertDto.preserveFormatting !== false,
        },
      };

      // Execute conversion
      const result = await this.conversionEngine.convertFile(conversionRequest);

      // Generate output filename
      const outputFilename = this.generateOutputFilename(
        file.originalname,
        convertDto.targetFormat,
      );

      // Handle response format
      if (convertDto.responseFormat === 'base64') {
        // Return base64 encoded response
        return res.status(HttpStatus.OK).json({
          success: true,
          filename: outputFilename,
          content_type: this.getContentType(convertDto.targetFormat),
          file_size: result.buffer.length,
          data: result.buffer.toString('base64'),
          processing_time_ms: result.processingTime,
          engine_used: result.engineUsed,
          conversion_info: {
            source_format: result.sourceFormat,
            target_format: result.targetFormat,
            original_size: result.originalSize,
            converted_size: result.convertedSize,
          },
          memory_usage: result.memoryUsage,
        });
      } else {
        // Return binary response (default)
        res.setHeader('Content-Type', this.getContentType(convertDto.targetFormat));
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        res.setHeader('Content-Length', result.buffer.length);
        res.setHeader('X-Processing-Time', result.processingTime.toString());
        res.setHeader('X-Engine-Used', result.engineUsed);
        res.setHeader('X-Source-Format', result.sourceFormat);
        res.setHeader('X-Target-Format', result.targetFormat);
        res.setHeader('X-Original-Size', result.originalSize.toString());
        res.setHeader('X-Converted-Size', result.convertedSize.toString());

        return res.status(HttpStatus.OK).send(result.buffer);
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Conversion failed after ${processingTime}ms:`, error);

      // Handle different types of errors
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: error.message,
            processing_time_ms: processingTime,
          },
        });
      }

      // Generic server error
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        error: {
          code: 'CONVERSION_FAILED',
          message: 'Failed to convert file. Please check file format and try again.',
          details: error.message,
          processing_time_ms: processingTime,
        },
      });
    }
  }

  /**
   * Generate output filename based on input and target format
   */
  private generateOutputFilename(originalFilename: string, targetFormat: string): string {
    const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${nameWithoutExt}-converted-${timestamp}.${targetFormat}`;
  }

  /**
   * Get content type for target format
   */
  private getContentType(targetFormat: string): string {
    const contentTypes = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    return contentTypes[targetFormat] || 'application/octet-stream';
  }

  /**
   * Validate file size based on conversion type
   */
  private validateFileSize(file: Express.Multer.File, targetFormat: string): void {
    const fileSizeMB = file.size / (1024 * 1024);

    // Different size limits based on conversion direction
    if (targetFormat === 'pdf') {
      // Office to PDF: 100MB limit
      const maxSize = 100;
      if (fileSizeMB > maxSize) {
        throw new BadRequestException(
          `File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${maxSize}MB for Office to PDF conversion`
        );
      }
    } else {
      // PDF to Office: 50MB limit
      const maxSize = 50;
      if (fileSizeMB > maxSize) {
        throw new BadRequestException(
          `File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${maxSize}MB for PDF to Office conversion`
        );
      }

      // Additional validation: ensure source is PDF for PDF to Office conversion
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException(
          `Invalid source format for ${targetFormat} conversion. Expected PDF file, got ${file.mimetype}`
        );
      }
    }
  }
}