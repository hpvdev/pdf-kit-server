import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import * as compression from 'compression';
import { createWinstonLogger } from './config/winston.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Memory configuration
process.env.NODE_OPTIONS = '--max-old-space-size=8192'; // 8GB heap

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
  });
  const configService = app.get(ConfigService);

  // Compression middleware for response optimization
  app.use(compression({
    filter: (req, res) => {
      // Don't compress binary file responses
      if (res.getHeader('Content-Type')?.toString().includes('application/octet-stream') ||
          res.getHeader('Content-Type')?.toString().includes('application/pdf') ||
          res.getHeader('Content-Type')?.toString().includes('application/vnd.openxmlformats')) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (1-9, 6 is default)
  }));

  // Request size limits for file uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    methods: configService.get('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
    credentials: configService.get('CORS_CREDENTIALS', 'false') === 'true',
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transformation interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix for API routes
  app.setGlobalPrefix('api/v1');

  // Swagger/OpenAPI documentation setup
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
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
