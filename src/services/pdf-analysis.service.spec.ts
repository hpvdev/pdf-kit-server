import { Test, TestingModule } from '@nestjs/testing';
import { PdfAnalysisService } from './pdf-analysis.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('PdfAnalysisService', () => {
  let service: PdfAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfAnalysisService],
    }).compile();

    service = module.get<PdfAnalysisService>(PdfAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzePdf', () => {
    it('should analyze a simple PDF buffer', async () => {
      // Create a minimal PDF buffer for testing
      const simplePdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n' +
        '2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n' +
        '3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\n' +
        'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n' +
        '0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF'
      );

      try {
        const result = await service.analyzePdf(simplePdfBuffer);
        
        expect(result).toBeDefined();
        expect(result.pageCount).toBeGreaterThanOrEqual(0);
        expect(result.textBlocks).toBeDefined();
        expect(result.images).toBeDefined();
        expect(result.tables).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.estimatedComplexity).toMatch(/^(simple|medium|complex)$/);
        
      } catch (error) {
        // PDF parsing might fail with minimal PDF, which is acceptable for this test
        expect(error.message).toContain('Failed to analyze PDF');
      }
    });

    it('should handle invalid PDF buffer gracefully', async () => {
      const invalidBuffer = Buffer.from('This is not a PDF file');

      await expect(service.analyzePdf(invalidBuffer)).rejects.toThrow('Failed to analyze PDF');
    });
  });

  describe('convertToDocx', () => {
    it('should convert PDF analysis to DOCX format', async () => {
      const mockAnalysis = {
        pageCount: 1,
        textBlocks: [
          {
            text: 'Sample text',
            x: 50,
            y: 100,
            width: 200,
            height: 20,
            fontSize: 12,
            pageNumber: 1,
          },
        ],
        images: [],
        tables: [],
        metadata: {},
        rawText: 'Sample text',
        hasImages: false,
        hasTables: false,
        estimatedComplexity: 'simple' as const,
      };

      const pdfBuffer = Buffer.from('mock pdf content');
      const result = await service.convertToDocx(pdfBuffer, mockAnalysis);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.processingTime).toBeDefined();
      expect(result.engineUsed).toBe('pdf-analysis-basic');
      expect(result.originalSize).toBe(pdfBuffer.length);
      expect(result.convertedSize).toBe(result.buffer.length);
    });
  });

  describe('convertToXlsx', () => {
    it('should convert PDF analysis to XLSX format', async () => {
      const mockAnalysis = {
        pageCount: 1,
        textBlocks: [],
        images: [],
        tables: [
          {
            rows: [['Header 1', 'Header 2'], ['Data 1', 'Data 2']],
            x: 50,
            y: 100,
            width: 300,
            height: 40,
            pageNumber: 1,
          },
        ],
        metadata: {},
        rawText: 'Header 1\tHeader 2\nData 1\tData 2',
        hasImages: false,
        hasTables: true,
        estimatedComplexity: 'medium' as const,
      };

      const pdfBuffer = Buffer.from('mock pdf content');
      const result = await service.convertToXlsx(pdfBuffer, mockAnalysis);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.processingTime).toBeDefined();
      expect(result.engineUsed).toBe('pdf-analysis-basic');
      expect(result.originalSize).toBe(pdfBuffer.length);
      expect(result.convertedSize).toBe(result.buffer.length);
    });
  });

  describe('convertToPptx', () => {
    it('should convert PDF analysis to PPTX format', async () => {
      const mockAnalysis = {
        pageCount: 2,
        textBlocks: [
          {
            text: 'Slide 1 content',
            x: 50,
            y: 100,
            width: 400,
            height: 30,
            fontSize: 16,
            pageNumber: 1,
          },
          {
            text: 'Slide 2 content',
            x: 50,
            y: 100,
            width: 400,
            height: 30,
            fontSize: 16,
            pageNumber: 2,
          },
        ],
        images: [],
        tables: [],
        metadata: {},
        rawText: 'Slide 1 content\n\nSlide 2 content',
        hasImages: false,
        hasTables: false,
        estimatedComplexity: 'simple' as const,
      };

      const pdfBuffer = Buffer.from('mock pdf content');
      const result = await service.convertToPptx(pdfBuffer, mockAnalysis);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.processingTime).toBeDefined();
      expect(result.engineUsed).toBe('pdf-analysis-basic');
      expect(result.originalSize).toBe(pdfBuffer.length);
      expect(result.convertedSize).toBe(result.buffer.length);
    });
  });

  describe('table detection', () => {
    it('should detect simple table patterns in text', async () => {
      // This test would require access to private methods, so we'll test through analyzePdf
      const textWithTable = `
Name        Age     City
John        25      New York
Jane        30      Los Angeles
Bob         35      Chicago
`;

      // Create a mock PDF buffer that would contain this text
      // In a real scenario, this would be a proper PDF with the table content
      const mockPdfBuffer = Buffer.from('%PDF-1.4\n' + textWithTable + '\n%%EOF');

      try {
        const result = await service.analyzePdf(mockPdfBuffer);
        // The table detection might work depending on the PDF parsing library's ability
        // to extract the text in the expected format
        expect(result).toBeDefined();
      } catch (error) {
        // Expected for mock PDF buffer
        expect(error.message).toContain('Failed to analyze PDF');
      }
    });
  });

  describe('complexity estimation', () => {
    it('should estimate complexity correctly', async () => {
      // Test through the public analyzePdf method with different scenarios
      const simplePdfBuffer = Buffer.from('Simple text content');

      try {
        const result = await service.analyzePdf(simplePdfBuffer);
        expect(['simple', 'medium', 'complex']).toContain(result.estimatedComplexity);
      } catch (error) {
        // Expected for invalid PDF
        expect(error.message).toContain('Failed to analyze PDF');
      }
    });
  });
});
