import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validateFileSize } from '../../config/multer.config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!file) {
      throw new BadRequestException({
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'No file was provided',
          details: {
            suggestion: 'Please select a file to upload'
          }
        }
      });
    }

    // Validate file size based on file type
    validateFileSize(file);

    return file;
  }
}