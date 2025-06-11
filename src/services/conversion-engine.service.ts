import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { LibreOfficeService, ConversionOptions, ConversionResult } from './libreoffice.service';
import { MemoryMonitorService } from './memory-monitor.service';

export interface FileConversionRequest {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  targetFormat: string;
  options?: ConversionOptions;
}

export interface ConversionEngineResult extends ConversionResult {
  targetFormat: string;
  sourceFormat: string;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

@Injectable()
export class ConversionEngineService {
  private readonly logger = new Logger(ConversionEngineService.name);
  private activeConversions = 0;
  private readonly maxConcurrentConversions = 3;
  private peakMemoryUsage = 0;

  constructor(
    private readonly libreOfficeService: LibreOfficeService,
    private readonly memoryMonitor: MemoryMonitorService,
  ) {}

  /**
   * Main conversion method that routes to appropriate conversion engine
   */
  async convertFile(request: FileConversionRequest): Promise<ConversionEngineResult> {
    // Check concurrent conversion limit
    if (this.activeConversions >= this.maxConcurrentConversions) {
      throw new BadRequestException(
        `Server is busy. Maximum ${this.maxConcurrentConversions} concurrent conversions allowed.`
      );
    }

    // Validate file size and format
    this.validateConversionRequest(request);

    this.activeConversions++;
    const memoryBefore = this.getCurrentMemoryUsage();
    
    try {
      this.logger.log(`Starting conversion: ${request.mimeType} -> ${request.targetFormat}`);
      
      let result: ConversionEngineResult;

      // Route to appropriate conversion method
      if (request.targetFormat === 'pdf') {
        result = await this.convertOfficeToPdf(request);
      } else {
        throw new BadRequestException(`Conversion to ${request.targetFormat} not yet implemented`);
      }

      const memoryAfter = this.getCurrentMemoryUsage();
      const peakMemory = this.getPeakMemoryUsage();

      result.memoryUsage = {
        before: memoryBefore,
        after: memoryAfter,
        peak: peakMemory,
      };

      this.logger.log(`Conversion completed successfully: ${result.sourceFormat} -> ${result.targetFormat}`);
      return result;

    } catch (error) {
      this.logger.error(`Conversion failed: ${error.message}`, error.stack);
      throw error;
    } finally {
      this.activeConversions--;
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Convert Office documents to PDF using LibreOffice
   */
  private async convertOfficeToPdf(request: FileConversionRequest): Promise<ConversionEngineResult> {
    if (!this.libreOfficeService.isSupportedFormat(request.mimeType)) {
      throw new BadRequestException(`Unsupported source format: ${request.mimeType}`);
    }

    const result = await this.libreOfficeService.convertToPdf(
      request.buffer,
      request.originalFilename,
      request.options,
    );

    return {
      ...result,
      targetFormat: 'pdf',
      sourceFormat: this.getFormatFromMimeType(request.mimeType),
    };
  }

  /**
   * Validate conversion request parameters
   */
  private validateConversionRequest(request: FileConversionRequest): void {
    // Validate file buffer
    if (!request.buffer || request.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty');
    }

    // Validate file size limits
    const fileSizeMB = request.buffer.length / (1024 * 1024);
    const maxSizeForOfficeToPDF = 100; // 100MB for Office to PDF
    const maxSizeForPDFToOffice = 50;  // 50MB for PDF to Office

    if (request.targetFormat === 'pdf' && fileSizeMB > maxSizeForOfficeToPDF) {
      throw new BadRequestException(
        `File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${maxSizeForOfficeToPDF}MB for Office to PDF conversion`
      );
    }

    if (request.targetFormat !== 'pdf' && fileSizeMB > maxSizeForPDFToOffice) {
      throw new BadRequestException(
        `File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${maxSizeForPDFToOffice}MB for PDF to Office conversion`
      );
    }

    // Validate MIME type
    if (!request.mimeType) {
      throw new BadRequestException('MIME type is required');
    }

    // Validate target format
    const supportedTargetFormats = ['pdf', 'docx', 'xlsx', 'pptx'];
    if (!supportedTargetFormats.includes(request.targetFormat)) {
      throw new BadRequestException(`Unsupported target format: ${request.targetFormat}`);
    }

    // Validate filename
    if (!request.originalFilename) {
      throw new BadRequestException('Original filename is required');
    }
  }

  /**
   * Get format name from MIME type
   */
  private getFormatFromMimeType(mimeType: string): string {
    const mimeToFormat = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/msword': 'doc',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/pdf': 'pdf',
      'application/vnd.oasis.opendocument.text': 'odt',
      'application/vnd.oasis.opendocument.spreadsheet': 'ods',
      'application/vnd.oasis.opendocument.presentation': 'odp',
    };

    return mimeToFormat[mimeType] || 'unknown';
  }

  /**
   * Get current memory usage in bytes
   */
  private getCurrentMemoryUsage(): number {
    const memStats = this.memoryMonitor.getMemoryStats();
    return memStats.used;
  }

  /**
   * Get peak memory usage during this session
   */
  private getPeakMemoryUsage(): number {
    const current = this.getCurrentMemoryUsage();
    if (current > this.peakMemoryUsage) {
      this.peakMemoryUsage = current;
    }
    return this.peakMemoryUsage;
  }

  /**
   * Get current conversion statistics
   */
  getConversionStats(): {
    activeConversions: number;
    maxConcurrentConversions: number;
    memoryUsage: number;
    isLibreOfficeAvailable: Promise<boolean>;
  } {
    return {
      activeConversions: this.activeConversions,
      maxConcurrentConversions: this.maxConcurrentConversions,
      memoryUsage: this.getCurrentMemoryUsage(),
      isLibreOfficeAvailable: this.libreOfficeService.checkLibreOfficeAvailability(),
    };
  }

  /**
   * Check if conversion engine is ready
   */
  async isEngineReady(): Promise<boolean> {
    try {
      const isLibreOfficeAvailable = await this.libreOfficeService.checkLibreOfficeAvailability();
      const memoryOk = this.memoryMonitor.checkMemoryThreshold();
      
      return isLibreOfficeAvailable && memoryOk;
    } catch (error) {
      this.logger.error('Error checking engine readiness:', error);
      return false;
    }
  }

  /**
   * Get supported conversion formats
   */
  getSupportedConversions(): Array<{
    from: string[];
    to: string;
    maxFileSizeMB: number;
    estimatedTimeSeconds: string;
  }> {
    return [
      {
        from: ['docx', 'doc', 'odt'],
        to: 'pdf',
        maxFileSizeMB: 100,
        estimatedTimeSeconds: '2-10',
      },
      {
        from: ['xlsx', 'xls', 'ods'],
        to: 'pdf',
        maxFileSizeMB: 100,
        estimatedTimeSeconds: '3-15',
      },
      {
        from: ['pptx', 'ppt', 'odp'],
        to: 'pdf',
        maxFileSizeMB: 100,
        estimatedTimeSeconds: '5-20',
      },
    ];
  }

  /**
   * Get LibreOffice version information
   */
  async getEngineInfo(): Promise<{
    libreOfficeVersion: string;
    isAvailable: boolean;
    supportedFormats: string[];
  }> {
    try {
      const isAvailable = await this.libreOfficeService.checkLibreOfficeAvailability();
      let version = 'Unknown';
      
      if (isAvailable) {
        try {
          version = await this.libreOfficeService.getLibreOfficeVersion();
        } catch (error) {
          this.logger.warn('Could not get LibreOffice version:', error);
        }
      }

      return {
        libreOfficeVersion: version,
        isAvailable,
        supportedFormats: [
          'docx', 'doc', 'odt',
          'xlsx', 'xls', 'ods', 
          'pptx', 'ppt', 'odp'
        ],
      };
    } catch (error) {
      this.logger.error('Error getting engine info:', error);
      return {
        libreOfficeVersion: 'Error',
        isAvailable: false,
        supportedFormats: [],
      };
    }
  }
} 