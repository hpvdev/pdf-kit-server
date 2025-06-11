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
exports.ConvertFileDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class ConvertFileDto {
    targetFormat;
    responseFormat = 'binary';
    quality = 'standard';
    timeout = 30000;
    preserveFormatting = true;
    file;
}
exports.ConvertFileDto = ConvertFileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Target format for conversion',
        enum: ['pdf', 'docx', 'xlsx', 'pptx'],
        example: 'pdf',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['pdf', 'docx', 'xlsx', 'pptx']),
    __metadata("design:type", String)
], ConvertFileDto.prototype, "targetFormat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Response format - binary (default) or base64',
        enum: ['binary', 'base64'],
        default: 'binary',
        example: 'binary',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['binary', 'base64']),
    __metadata("design:type", String)
], ConvertFileDto.prototype, "responseFormat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Conversion quality setting',
        enum: ['standard', 'high'],
        default: 'standard',
        example: 'standard',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['standard', 'high']),
    __metadata("design:type", String)
], ConvertFileDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Conversion timeout in milliseconds',
        minimum: 5000,
        maximum: 60000,
        default: 30000,
        example: 30000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5000),
    (0, class_validator_1.Max)(60000),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Number)
], ConvertFileDto.prototype, "timeout", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether to preserve original formatting',
        default: true,
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        return Boolean(value);
    }),
    __metadata("design:type", Boolean)
], ConvertFileDto.prototype, "preserveFormatting", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'File to convert',
        type: 'string',
        format: 'binary',
    }),
    __metadata("design:type", Object)
], ConvertFileDto.prototype, "file", void 0);
//# sourceMappingURL=convert-file.dto.js.map