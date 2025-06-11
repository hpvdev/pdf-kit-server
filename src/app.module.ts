import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { FormatsModule } from './modules/formats/formats.module';
import { ConversionModule } from './modules/conversion/conversion.module';
import { MemoryMonitorService } from './services/memory-monitor.service';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    
    // Health check module
    HealthModule,
    
    // Formats module
    FormatsModule,
    
    // Conversion module
    ConversionModule,
    
    // Rate limiting module
    ThrottlerModule.forRoot([
      {
        ttl: 3600000, // 1 hour in milliseconds
        limit: 50, // 50 requests per hour
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, MemoryMonitorService],
})
export class AppModule {}
