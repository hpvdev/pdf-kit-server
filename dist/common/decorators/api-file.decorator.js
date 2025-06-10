"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiFile = ApiFile;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_config_1 = require("../../config/multer.config");
const concurrency_interceptor_1 = require("../interceptors/concurrency.interceptor");
const timeout_interceptor_1 = require("../interceptors/timeout.interceptor");
function ApiFile(fieldName = 'file') {
    return (0, common_1.applyDecorators)((0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)(fieldName, multer_config_1.multerConfig), concurrency_interceptor_1.ConcurrencyInterceptor, new timeout_interceptor_1.TimeoutInterceptor(30000)));
}
//# sourceMappingURL=api-file.decorator.js.map