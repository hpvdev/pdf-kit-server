"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMimeTypeFromExtension = exports.getFileExtension = exports.validateFileSize = exports.multerConfig = void 0;
const common_1 = require("@nestjs/common");
const multer = require("multer");
const FILE_LIMITS = {
    pdf: 50 * 1024 * 1024,
    docx: 100 * 1024 * 1024,
    xlsx: 100 * 1024 * 1024,
    pptx: 100 * 1024 * 1024,
    doc: 100 * 1024 * 1024,
    xls: 100 * 1024 * 1024,
    ppt: 100 * 1024 * 1024,
};
const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
];
exports.multerConfig = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        if (!SUPPORTED_MIME_TYPES.includes(file.mimetype)) {
            return callback(new common_1.HttpException({
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
            }, common_1.HttpStatus.BAD_REQUEST), false);
        }
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        if (!fileExtension || !FILE_LIMITS[fileExtension]) {
            return callback(new common_1.HttpException({
                error: {
                    code: 'INVALID_FILE_EXTENSION',
                    message: 'Invalid file extension',
                    details: {
                        received_extension: fileExtension,
                        supported_extensions: Object.keys(FILE_LIMITS)
                    }
                }
            }, common_1.HttpStatus.BAD_REQUEST), false);
        }
        callback(null, true);
    },
};
const validateFileSize = (file) => {
    if (!file) {
        throw new common_1.HttpException({
            error: {
                code: 'NO_FILE_PROVIDED',
                message: 'No file was provided',
                details: {
                    suggestion: 'Please select a file to upload'
                }
            }
        }, common_1.HttpStatus.BAD_REQUEST);
    }
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !FILE_LIMITS[fileExtension]) {
        throw new common_1.HttpException({
            error: {
                code: 'INVALID_FILE_EXTENSION',
                message: 'Invalid file extension',
                details: {
                    received_extension: fileExtension,
                    supported_extensions: Object.keys(FILE_LIMITS)
                }
            }
        }, common_1.HttpStatus.BAD_REQUEST);
    }
    const maxSize = FILE_LIMITS[fileExtension];
    if (file.size > maxSize) {
        throw new common_1.HttpException({
            error: {
                code: 'FILE_TOO_LARGE',
                message: `File size exceeds limit for ${fileExtension.toUpperCase()} files`,
                details: {
                    received_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
                    max_size_mb: Math.round(maxSize / 1024 / 1024),
                    file_type: fileExtension.toUpperCase()
                }
            }
        }, common_1.HttpStatus.PAYLOAD_TOO_LARGE);
    }
};
exports.validateFileSize = validateFileSize;
const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toLowerCase() || '';
};
exports.getFileExtension = getFileExtension;
const getMimeTypeFromExtension = (extension) => {
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
exports.getMimeTypeFromExtension = getMimeTypeFromExtension;
//# sourceMappingURL=multer.config.js.map