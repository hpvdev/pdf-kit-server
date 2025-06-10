import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum OutputFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  PPTX = 'pptx',
}

export enum ResponseFormat {
  BINARY = 'binary',
  BASE64 = 'base64',
}

export enum Quality {
  STANDARD = 'standard',
  HIGH = 'high',
}

export class ConvertFileDto {
  @IsEnum(OutputFormat, {
    message: 'output_format must be one of: pdf, docx, xlsx, pptx'
  })
  output_format: OutputFormat;

  @IsOptional()
  @IsEnum(ResponseFormat, {
    message: 'response_format must be one of: binary, base64'
  })
  response_format?: ResponseFormat = ResponseFormat.BINARY;

  @IsOptional()
  @IsEnum(Quality, {
    message: 'quality must be one of: standard, high'
  })
  quality?: Quality = Quality.STANDARD;
} 