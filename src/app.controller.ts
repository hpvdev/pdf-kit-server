import { Controller, Get, Post, UploadedFile, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiFile } from './common/decorators/api-file.decorator';
import { FileValidationPipe } from './common/pipes/file-validation.pipe';
import { ConvertFileDto } from './modules/conversion/dto/convert-file.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('info')
  getServerInfo() {
    return {
      name: 'PDF Kit Server',
      version: '2.0.0',
      description: 'High-performance PDF and Office document conversion service',
      features: [
        'PDF to Office conversion',
        'Office to PDF conversion',
        'Memory-optimized processing',
        'Concurrent request handling',
        'Mobile-friendly API responses'
      ],
      endpoints: {
        health: '/api/v1/health',
        formats: '/api/v1/formats',
        convert: '/api/v1/convert'
      }
    };
  }

  @Post('test-upload')
  @ApiFile()
  testFileUpload(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() body: ConvertFileDto
  ) {
    return {
      success: true,
      message: 'File uploaded successfully',
      file_info: {
        original_name: file.originalname,
        size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
        mime_type: file.mimetype,
        buffer_length: file.buffer.length
      },
      conversion_params: body
    };
  }
}
