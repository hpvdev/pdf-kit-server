"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const formats_service_1 = require("./formats.service");
let FormatsController = class FormatsController {
    formatsService;
    constructor(formatsService) {
        this.formatsService = formatsService;
    }
    getSupportedFormats() {
        return this.formatsService.getSupportedConversions();
    }
};
exports.FormatsController = FormatsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
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
    }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FormatsController.prototype, "getSupportedFormats", null);
exports.FormatsController = FormatsController = __decorate([
    (0, swagger_1.ApiTags)('formats'),
    (0, common_1.Controller)('formats'),
    __metadata("design:paramtypes", [formats_service_1.FormatsService])
], FormatsController);
//# sourceMappingURL=formats.controller.js.map