"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express = require("express");
const compression = require("compression");
const winston_config_1 = require("./config/winston.config");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
const swagger_1 = require("@nestjs/swagger");
process.env.NODE_OPTIONS = '--max-old-space-size=8192';
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: (0, winston_config_1.createWinstonLogger)(),
    });
    const configService = app.get(config_1.ConfigService);
    app.use(compression({
        filter: (req, res) => {
            if (res.getHeader('Content-Type')?.toString().includes('application/octet-stream') ||
                res.getHeader('Content-Type')?.toString().includes('application/pdf') ||
                res.getHeader('Content-Type')?.toString().includes('application/vnd.openxmlformats')) {
                return false;
            }
            return compression.filter(req, res);
        },
        threshold: 1024,
        level: 6,
    }));
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ limit: '100mb', extended: true }));
    app.enableCors({
        origin: configService.get('CORS_ORIGIN', '*'),
        methods: configService.get('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
        credentials: configService.get('CORS_CREDENTIALS', 'false') === 'true',
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new response_transform_interceptor_1.ResponseTransformInterceptor());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('PDF Kit Server API')
        .setDescription('High-performance PDF and Office document conversion service with mobile optimization')
        .setVersion('2.0.0')
        .setContact('PDF Kit Team', 'https://github.com/your-org/pdf-kit-server', 'support@pdfkit.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addTag('conversion', 'Document conversion endpoints')
        .addTag('health', 'Health check and monitoring')
        .addTag('formats', 'Supported formats information')
        .addServer('http://localhost:3000/api/v1', 'Development server')
        .addServer('https://api.pdfkit.com/api/v1', 'Production server')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/v1/docs', app, document, {
        customSiteTitle: 'PDF Kit Server API Documentation',
        customfavIcon: '/favicon.ico',
        customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
    `,
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
        },
    });
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`🚀 PDF Kit Server is running on: http://localhost:${port}/api/v1`);
    console.log(`📊 Health check available at: http://localhost:${port}/api/v1/health`);
    console.log(`📚 API Documentation available at: http://localhost:${port}/api/v1/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map