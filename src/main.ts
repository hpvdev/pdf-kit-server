import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as express from 'express';
import { createWinstonLogger } from './config/winston.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Memory configuration
process.env.NODE_OPTIONS = '--max-old-space-size=8192'; // 8GB heap

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createWinstonLogger(),
  });
  const configService = app.get(ConfigService);

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

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  console.log(`🚀 PDF Kit Server is running on: http://localhost:${port}/api/v1`);
  console.log(`📊 Health check available at: http://localhost:${port}/api/v1/health`);
}

bootstrap();
