import { Controller, Get } from '@nestjs/common';
import { FormatsService } from './formats.service';

@Controller('formats')
export class FormatsController {
  constructor(private readonly formatsService: FormatsService) {}

  @Get()
  getSupportedFormats() {
    return this.formatsService.getSupportedConversions();
  }
} 