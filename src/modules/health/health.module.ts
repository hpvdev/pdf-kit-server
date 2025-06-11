import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { ConversionModule } from '../conversion/conversion.module';

@Module({
  imports: [
    TerminusModule,
    ConversionModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {} 