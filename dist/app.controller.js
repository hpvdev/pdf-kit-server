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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const api_file_decorator_1 = require("./common/decorators/api-file.decorator");
const file_validation_pipe_1 = require("./common/pipes/file-validation.pipe");
const convert_file_dto_1 = require("./modules/conversion/dto/convert-file.dto");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
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
    testFileUpload(file, body) {
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
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getServerInfo", null);
__decorate([
    (0, common_1.Post)('test-upload'),
    (0, api_file_decorator_1.ApiFile)(),
    __param(0, (0, common_1.UploadedFile)(file_validation_pipe_1.FileValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, convert_file_dto_1.ConvertFileDto]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "testFileUpload", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map