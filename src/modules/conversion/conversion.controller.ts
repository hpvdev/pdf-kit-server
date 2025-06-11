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
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import * as multer from 'multer';

@ApiTags('Conversion')
@Controller('convert')
export class ConversionController {
  private readonly logger = new Logger(ConversionController.name);

  constructor(private readonly conversionEngine: ConversionEngineService) {}

  @Post()
  @ApiOperation({ summary: 'Convert Office documents to PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'File converted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or parameters' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @ApiResponse({ status: 422, description: 'Conversion failed' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Validate MIME types
        const allowedMimeTypes = [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/msword', // .doc
          'application/vnd.ms-excel', // .xls
          'application/vnd.ms-powerpoint', // .ppt
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
} 