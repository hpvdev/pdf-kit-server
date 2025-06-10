import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as multer from 'multer';

// Supported file types and their max sizes
const FILE_LIMITS = {
  pdf: 50 * 1024 * 1024, // 50MB for PDF to Office
  docx: 100 * 1024 * 1024, // 100MB for Office to PDF
  xlsx: 100 * 1024 * 1024,
  pptx: 100 * 1024 * 1024,
  doc: 100 * 1024 * 1024,
  xls: 100 * 1024 * 1024,
  ppt: 100 * 1024 * 1024,
};

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/msword', // .doc
  'application/vnd.ms-excel', // .xls
  'application/vnd.ms-powerpoint', // .ppt
];

export const multerConfig: MulterOptions = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (will be validated per file type)
    files: 1, // Only one file at a time
  },
  fileFilter: (req, file, callback) => {
    // Check MIME type
    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new HttpException(
          {
            error: {
              code: 'UNSUPPORTED_FILE_TYPE',
              message: 'File type not supported',
              details: {
                received_type: file.mimetype,
                supported_types: [
                  'PDF (.pdf)',
                  'Word (.docx, .doc)',
                  'Excel (.xlsx, .xls)',
                  'PowerPoint (.pptx, .ppt)'
                ]
              }
            }
          },
          HttpStatus.BAD_REQUEST
        ),
        false
      );
    }

    // Get file extension from original name
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !FILE_LIMITS[fileExtension]) {
      return callback(
        new HttpException(
          {
            error: {
              code: 'INVALID_FILE_EXTENSION',
              message: 'Invalid file extension',
              details: {
                received_extension: fileExtension,
                supported_extensions: Object.keys(FILE_LIMITS)
              }
            }
          },
          HttpStatus.BAD_REQUEST
        ),
        false
      );
    }

    callback(null, true);
  },
};

export const validateFileSize = (file: Express.Multer.File): void => {
  if (!file) {
    throw new HttpException(
      {
        error: {
          code: 'NO_FILE_PROVIDED',
          message: 'No file was provided',
          details: {
            suggestion: 'Please select a file to upload'
          }
        }
      },
      HttpStatus.BAD_REQUEST
    );
  }

  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
  
  if (!fileExtension || !FILE_LIMITS[fileExtension]) {
    throw new HttpException(
      {
        error: {
          code: 'INVALID_FILE_EXTENSION',
          message: 'Invalid file extension',
          details: {
            received_extension: fileExtension,
            supported_extensions: Object.keys(FILE_LIMITS)
          }
        }
      },
      HttpStatus.BAD_REQUEST
    );
  }

  const maxSize = FILE_LIMITS[fileExtension];

  if (file.size > maxSize) {
    throw new HttpException(
      {
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds limit for ${fileExtension.toUpperCase()} files`,
          details: {
            received_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
            max_size_mb: Math.round(maxSize / 1024 / 1024),
            file_type: fileExtension.toUpperCase()
          }
        }
      },
      HttpStatus.PAYLOAD_TOO_LARGE
    );
  }
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    doc: 'application/msword',
    xls: 'application/vnd.ms-excel',
    ppt: 'application/vnd.ms-powerpoint',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}; 