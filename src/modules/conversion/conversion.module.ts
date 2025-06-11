import { Module } from '@nestjs/common';
import { ConversionController } from './conversion.controller';
import { ConversionEngineService } from '../../services/conversion-engine.service';
import { LibreOfficeService } from '../../services/libreoffice.service';
import { MemoryMonitorService } from '../../services/memory-monitor.service';

@Module({
  controllers: [ConversionController],
  providers: [
    ConversionEngineService,
    LibreOfficeService,
    MemoryMonitorService,
  ],
  exports: [
    ConversionEngineService,
    LibreOfficeService,
  ],
})
export class ConversionModule {} 