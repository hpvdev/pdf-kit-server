import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FormatsService } from './formats.service';

@ApiTags('formats')
@Controller('formats')
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get supported conversion formats',
    description: `
      Returns information about all supported file format conversions.

      **Supported conversions:**
      - Office to PDF: DOCX, XLSX, PPTX, DOC, XLS, PPT, ODT, ODS, ODP → PDF
      - PDF to Office: PDF → DOCX, XLSX, PPTX

      **File size limits:**
      - Office to PDF: 100MB maximum
      - PDF to Office: 50MB maximum

      **Processing time estimates:**
      - Simple documents: 2-10 seconds
      - Complex documents: 5-30 seconds
    `
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported conversion formats',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            supported_formats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['docx', 'doc', 'odt']
                  },
                  to: { type: 'string', example: 'pdf' },
                  maxFileSizeMB: { type: 'number', example: 100 },
                  estimatedTimeSeconds: { type: 'string', example: '2-10' },
                  description: { type: 'string', example: 'Convert Word documents to PDF' },
                  mimeTypes: {
                    type: 'object',
                    properties: {
                      input: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                      },
                      output: { type: 'string', example: 'application/pdf' }
                    }
                  }
                }
              }
            },
            total_conversions: { type: 'number', example: 6 },
            server_capabilities: {
              type: 'object',
              properties: {
                max_concurrent_conversions: { type: 'number', example: 3 },
                max_file_size_mb: { type: 'number', example: 100 },
                supported_engines: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['libreoffice', 'pdf-analysis-basic']
                }
              }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            server_version: { type: 'string', example: '2.0.0' },
            processing_time_ms: { type: 'number', example: 5 },
            timestamp: { type: 'string', example: '2024-07-24T10:00:00.000Z' },
            request_id: { type: 'string', example: 'req_1627123456789_abc123def' },
            mobile_optimized: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  getSupportedFormats() {
    return this.formatsService.getSupportedConversions();
  }
}