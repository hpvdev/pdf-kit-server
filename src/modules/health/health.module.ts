import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MemoryMonitorService } from '../../services/memory-monitor.service';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [MemoryMonitorService],
  exports: [MemoryMonitorService],
})
export class HealthModule {} 