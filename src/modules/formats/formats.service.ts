import { Injectable } from '@nestjs/common';

export interface SupportedFormat {
  extension: string;
  mime_type: string;
  description: string;
  max_size_mb: number;
  can_convert_to: string[];
}

@Injectable()
export class FormatsService {
  private readonly supportedFormats: SupportedFormat[] = [
    {
      extension: 'pdf',
      mime_type: 'application/pdf',
      description: 'Portable Document Format',
      max_size_mb: 50,
      can_convert_to: ['docx', 'xlsx', 'pptx']
    },
    {
      extension: 'docx',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      description: 'Microsoft Word Document',
      max_size_mb: 100,
      can_convert_to: ['pdf']
    },
    {
      extension: 'doc',
      mime_type: 'application/msword',
      description: 'Microsoft Word Document (Legacy)',
      max_size_mb: 100,
      can_convert_to: ['pdf', 'docx']
    },
    {
      extension: 'xlsx',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      description: 'Microsoft Excel Spreadsheet',
      max_size_mb: 100,
      can_convert_to: ['pdf']
    },
    {
      extension: 'xls',
      mime_type: 'application/vnd.ms-excel',
      description: 'Microsoft Excel Spreadsheet (Legacy)',
      max_size_mb: 100,
      can_convert_to: ['pdf', 'xlsx']
    },
    {
      extension: 'pptx',
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      description: 'Microsoft PowerPoint Presentation',
      max_size_mb: 100,
      can_convert_to: ['pdf']
    },
    {
      extension: 'ppt',
      mime_type: 'application/vnd.ms-powerpoint',
      description: 'Microsoft PowerPoint Presentation (Legacy)',
      max_size_mb: 100,
      can_convert_to: ['pdf', 'pptx']
    }
  ];

  getSupportedConversions() {
    return {
      supported_formats: this.supportedFormats,
      conversion_matrix: this.getConversionMatrix(),
      engines: {
        libreoffice: {
          version: '7.x',
          status: 'available',
          supported_conversions: [
            'pdf_to_office',
            'office_to_pdf'
          ]
        }
      },
      limits: {
        max_file_size_mb: 100,
        max_concurrent_conversions: 3,
        timeout_seconds: 30
      }
    };
  }

  private getConversionMatrix() {
    const matrix = {};
    
    this.supportedFormats.forEach(format => {
      matrix[format.extension] = format.can_convert_to;
    });

    return matrix;
  }

  isConversionSupported(fromFormat: string, toFormat: string): boolean {
    const format = this.supportedFormats.find(f => f.extension === fromFormat);
    return format ? format.can_convert_to.includes(toFormat) : false;
  }

  getFormatInfo(extension: string): SupportedFormat | undefined {
    return this.supportedFormats.find(f => f.extension === extension);
  }
} 