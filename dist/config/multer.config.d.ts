import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
export declare const multerConfig: MulterOptions;
export declare const validateFileSize: (file: Express.Multer.File) => void;
export declare const getFileExtension: (filename: string) => string;
export declare const getMimeTypeFromExtension: (extension: string) => string;
