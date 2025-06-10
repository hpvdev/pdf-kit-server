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
exports.ConvertFileDto = exports.Quality = exports.ResponseFormat = exports.OutputFormat = void 0;
const class_validator_1 = require("class-validator");
var OutputFormat;
(function (OutputFormat) {
    OutputFormat["PDF"] = "pdf";
    OutputFormat["DOCX"] = "docx";
    OutputFormat["XLSX"] = "xlsx";
    OutputFormat["PPTX"] = "pptx";
})(OutputFormat || (exports.OutputFormat = OutputFormat = {}));
var ResponseFormat;
(function (ResponseFormat) {
    ResponseFormat["BINARY"] = "binary";
    ResponseFormat["BASE64"] = "base64";
})(ResponseFormat || (exports.ResponseFormat = ResponseFormat = {}));
var Quality;
(function (Quality) {
    Quality["STANDARD"] = "standard";
    Quality["HIGH"] = "high";
})(Quality || (exports.Quality = Quality = {}));
class ConvertFileDto {
    output_format;
    response_format = ResponseFormat.BINARY;
    quality = Quality.STANDARD;
}
exports.ConvertFileDto = ConvertFileDto;
__decorate([
    (0, class_validator_1.IsEnum)(OutputFormat, {
        message: 'output_format must be one of: pdf, docx, xlsx, pptx'
    }),
    __metadata("design:type", String)
], ConvertFileDto.prototype, "output_format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ResponseFormat, {
        message: 'response_format must be one of: binary, base64'
    }),
    __metadata("design:type", String)
], ConvertFileDto.prototype, "response_format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(Quality, {
        message: 'quality must be one of: standard, high'
    }),
    __metadata("design:type", String)
], ConvertFileDto.prototype, "quality", void 0);
//# sourceMappingURL=convert-file.dto.js.map