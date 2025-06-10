"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express = require("express");
const winston_config_1 = require("./config/winston.config");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
process.env.NODE_OPTIONS = '--max-old-space-size=8192';
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: (0, winston_config_1.createWinstonLogger)(),
    });
    const configService = app.get(config_1.ConfigService);
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', '*'),
        methods: configService.get('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
        credentials: configService.get('CORS_CREDENTIALS', 'false') === 'true',
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix('api/v1');
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`🚀 PDF Kit Server is running on: http://localhost:${port}/api/v1`);
    console.log(`📊 Health check available at: http://localhost:${port}/api/v1/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map