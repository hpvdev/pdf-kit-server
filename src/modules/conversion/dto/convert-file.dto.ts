import { IsString, IsOptional, IsIn, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ConvertFileDto {
  @ApiProperty({
    description: 'Target format for conversion',
    enum: ['pdf', 'docx', 'xlsx', 'pptx'],
    example: 'pdf',
  })
  @IsString()
  @IsIn(['pdf', 'docx', 'xlsx', 'pptx'])
  targetFormat: string;

  @ApiPropertyOptional({
    description: 'Response format - binary (default) or base64',
    enum: ['binary', 'base64'],
    default: 'binary',
    example: 'binary',
  })
  @IsOptional()
  @IsString()
  @IsIn(['binary', 'base64'])
  responseFormat?: 'binary' | 'base64' = 'binary';

  @ApiPropertyOptional({
    description: 'Conversion quality setting',
    enum: ['standard', 'high'],
    default: 'standard',
    example: 'standard',
  })
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'high'])
  quality?: 'standard' | 'high' = 'standard';

  @ApiPropertyOptional({
    description: 'Conversion timeout in milliseconds',
    minimum: 5000,
    maximum: 60000,
    default: 30000,
    example: 30000,
  })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(60000)
  @Transform(({ value }) => parseInt(value))
  timeout?: number = 30000;

  @ApiPropertyOptional({
    description: 'Whether to preserve original formatting',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  preserveFormatting?: boolean = true;

  @ApiProperty({
    description: 'File to convert',
    type: 'string',
    format: 'binary',
  })
  file: any;
} 