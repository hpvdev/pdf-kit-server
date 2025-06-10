import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class FileValidationPipe implements PipeTransform {
    transform(file: Express.Multer.File, metadata: ArgumentMetadata): Express.Multer.File;
}
