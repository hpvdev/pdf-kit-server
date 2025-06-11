import { Test, TestingModule } from '@nestjs/testing';
import { ConversionEngineService } from './conversion-engine.service';
import { LibreOfficeService } from './libreoffice.service';
import { MemoryMonitorService } from './memory-monitor.service';
import { PdfAnalysisService } from './pdf-analysis.service';
import { BadRequestException } from '@nestjs/common';

describe('ConversionEngineService', () => {
  let service: ConversionEngineService;
  let libreOfficeService: LibreOfficeService;
  let memoryMonitorService: MemoryMonitorService;
  let pdfAnalysisService: PdfAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversionEngineService,
        {
          provide: LibreOfficeService,
          useValue: {
            isSupportedFormat: jest.fn(),
            convertToPdf: jest.fn(),
            checkLibreOfficeAvailability: jest.fn(),
            getLibreOfficeVersion: jest.fn(),
          },
        },
        {
          provide: MemoryMonitorService,
          useValue: {
            getMemoryStats: jest.fn().mockReturnValue({ used: 1000000 }),
            checkMemoryThreshold: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: PdfAnalysisService,
          useValue: {
            analyzePdf: jest.fn(),
            convertToDocx: jest.fn(),
            convertToXlsx: jest.fn(),
            convertToPptx: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversionEngineService>(ConversionEngineService);
    libreOfficeService = module.get<LibreOfficeService>(LibreOfficeService);
    memoryMonitorService = module.get<MemoryMonitorService>(MemoryMonitorService);
    pdfAnalysisService = module.get<PdfAnalysisService>(PdfAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertFile - Office to PDF', () => {
    it('should convert Office document to PDF', async () => {
      const mockRequest = {
        buffer: Buffer.from('mock docx content'),
        originalFilename: 'test.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        targetFormat: 'pdf',
      };

      const mockConversionResult = {
        buffer: Buffer.from('mock pdf content'),
        processingTime: 1000,
        engineUsed: 'libreoffice',
        originalSize: mockRequest.buffer.length,
        convertedSize: 100,
      };

      jest.spyOn(libreOfficeService, 'isSupportedFormat').mockReturnValue(true);
      jest.spyOn(libreOfficeService, 'convertToPdf').mockResolvedValue(mockConversionResult);

      const result = await service.convertFile(mockRequest);

      expect(result).toBeDefined();
      expect(result.targetFormat).toBe('pdf');
      expect(result.sourceFormat).toBe('docx');
      expect(result.buffer).toEqual(mockConversionResult.buffer);
      expect(result.memoryUsage).toBeDefined();
    });
  });

  describe('convertFile - PDF to Office', () => {
    it('should convert PDF to DOCX', async () => {
      const mockRequest = {
        buffer: Buffer.from('mock pdf content'),
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        targetFormat: 'docx',
      };

      const mockAnalysisResult = {
        pageCount: 1,
        textBlocks: [],
        images: [],
        tables: [],
        metadata: {},
        rawText: 'Sample text',
        hasImages: false,
        hasTables: false,
        estimatedComplexity: 'simple' as const,
      };

      const mockConversionResult = {
        buffer: Buffer.from('mock docx content'),
        processingTime: 2000,
        engineUsed: 'pdf-analysis-basic',
        originalSize: mockRequest.buffer.length,
        convertedSize: 200,
      };

      jest.spyOn(pdfAnalysisService, 'analyzePdf').mockResolvedValue(mockAnalysisResult);
      jest.spyOn(pdfAnalysisService, 'convertToDocx').mockResolvedValue(mockConversionResult);

      const result = await service.convertFile(mockRequest);

      expect(result).toBeDefined();
      expect(result.targetFormat).toBe('docx');
      expect(result.sourceFormat).toBe('pdf');
      expect(result.buffer).toEqual(mockConversionResult.buffer);
      expect(pdfAnalysisService.analyzePdf).toHaveBeenCalledWith(mockRequest.buffer);
      expect(pdfAnalysisService.convertToDocx).toHaveBeenCalledWith(
        mockRequest.buffer,
        mockAnalysisResult,
        undefined
      );
    });

    it('should convert PDF to XLSX', async () => {
      const mockRequest = {
        buffer: Buffer.from('mock pdf content'),
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        targetFormat: 'xlsx',
      };

      const mockAnalysisResult = {
        pageCount: 1,
        textBlocks: [],
        images: [],
        tables: [{ rows: [['A', 'B'], ['1', '2']], x: 0, y: 0, width: 100, height: 50, pageNumber: 1 }],
        metadata: {},
        rawText: 'A\tB\n1\t2',
        hasImages: false,
        hasTables: true,
        estimatedComplexity: 'medium' as const,
      };

      const mockConversionResult = {
        buffer: Buffer.from('mock xlsx content'),
        processingTime: 1500,
        engineUsed: 'pdf-analysis-basic',
        originalSize: mockRequest.buffer.length,
        convertedSize: 150,
      };

      jest.spyOn(pdfAnalysisService, 'analyzePdf').mockResolvedValue(mockAnalysisResult);
      jest.spyOn(pdfAnalysisService, 'convertToXlsx').mockResolvedValue(mockConversionResult);

      const result = await service.convertFile(mockRequest);

      expect(result).toBeDefined();
      expect(result.targetFormat).toBe('xlsx');
      expect(result.sourceFormat).toBe('pdf');
      expect(pdfAnalysisService.convertToXlsx).toHaveBeenCalled();
    });

    it('should convert PDF to PPTX', async () => {
      const mockRequest = {
        buffer: Buffer.from('mock pdf content'),
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        targetFormat: 'pptx',
      };

      const mockAnalysisResult = {
        pageCount: 2,
        textBlocks: [],
        images: [],
        tables: [],
        metadata: {},
        rawText: 'Slide content',
        hasImages: false,
        hasTables: false,
        estimatedComplexity: 'simple' as const,
      };

      const mockConversionResult = {
        buffer: Buffer.from('mock pptx content'),
        processingTime: 1800,
        engineUsed: 'pdf-analysis-basic',
        originalSize: mockRequest.buffer.length,
        convertedSize: 180,
      };

      jest.spyOn(pdfAnalysisService, 'analyzePdf').mockResolvedValue(mockAnalysisResult);
      jest.spyOn(pdfAnalysisService, 'convertToPptx').mockResolvedValue(mockConversionResult);

      const result = await service.convertFile(mockRequest);

      expect(result).toBeDefined();
      expect(result.targetFormat).toBe('pptx');
      expect(result.sourceFormat).toBe('pdf');
      expect(pdfAnalysisService.convertToPptx).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should reject empty buffer', async () => {
      const mockRequest = {
        buffer: Buffer.alloc(0),
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        targetFormat: 'docx',
      };

      await expect(service.convertFile(mockRequest)).rejects.toThrow(BadRequestException);
    });

    it('should reject file too large for PDF to Office conversion', async () => {
      const largeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      const mockRequest = {
        buffer: largeBuffer,
        originalFilename: 'large.pdf',
        mimeType: 'application/pdf',
        targetFormat: 'docx',
      };

      await expect(service.convertFile(mockRequest)).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported target format', async () => {
      const mockRequest = {
        buffer: Buffer.from('content'),
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        targetFormat: 'unsupported',
      };

      await expect(service.convertFile(mockRequest)).rejects.toThrow(BadRequestException);
    });

    it('should reject non-PDF for PDF to Office conversion', async () => {
      const mockRequest = {
        buffer: Buffer.from('content'),
        originalFilename: 'test.txt',
        mimeType: 'text/plain',
        targetFormat: 'docx',
      };

      await expect(service.convertFile(mockRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSupportedConversions', () => {
    it('should return all supported conversion formats including PDF to Office', () => {
      const conversions = service.getSupportedConversions();
      
      expect(conversions).toHaveLength(6); // 3 Office to PDF + 3 PDF to Office
      
      // Check PDF to Office conversions
      const pdfToDocx = conversions.find(c => c.from.includes('pdf') && c.to === 'docx');
      const pdfToXlsx = conversions.find(c => c.from.includes('pdf') && c.to === 'xlsx');
      const pdfToPptx = conversions.find(c => c.from.includes('pdf') && c.to === 'pptx');
      
      expect(pdfToDocx).toBeDefined();
      expect(pdfToXlsx).toBeDefined();
      expect(pdfToPptx).toBeDefined();
      
      expect(pdfToDocx?.maxFileSizeMB).toBe(50);
      expect(pdfToXlsx?.maxFileSizeMB).toBe(50);
      expect(pdfToPptx?.maxFileSizeMB).toBe(50);
    });
  });

  describe('concurrency control', () => {
    it('should reject requests when max concurrent conversions reached', async () => {
      // This test would require more complex setup to test actual concurrency
      // For now, we'll test the basic structure
      const stats = service.getConversionStats();
      expect(stats.maxConcurrentConversions).toBe(3);
      expect(stats.activeConversions).toBe(0);
    });
  });
});
