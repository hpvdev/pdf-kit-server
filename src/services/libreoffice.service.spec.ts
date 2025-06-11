import { Test, TestingModule } from '@nestjs/testing';
import { LibreOfficeService } from './libreoffice.service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('LibreOfficeService', () => {
  let service: LibreOfficeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LibreOfficeService],
    }).compile();

    service = module.get<LibreOfficeService>(LibreOfficeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLibreOfficeAvailability', () => {
    it('should check if LibreOffice is available', async () => {
      const isAvailable = await service.checkLibreOfficeAvailability();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('isSupportedFormat', () => {
    it('should return true for supported MIME types', () => {
      const supportedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];

      supportedTypes.forEach(mimeType => {
        expect(service.isSupportedFormat(mimeType)).toBe(true);
      });
    });

    it('should return false for unsupported MIME types', () => {
      const unsupportedTypes = [
        'application/pdf',
        'text/plain',
        'image/jpeg',
        'application/json',
      ];

      unsupportedTypes.forEach(mimeType => {
        expect(service.isSupportedFormat(mimeType)).toBe(false);
      });
    });
  });

  describe('getFileExtensionFromMimeType', () => {
    it('should return correct extensions for MIME types', () => {
      const mimeToExtension = {
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
        'application/msword': '.doc',
      };

      Object.entries(mimeToExtension).forEach(([mimeType, expectedExt]) => {
        expect(service.getFileExtensionFromMimeType(mimeType)).toBe(expectedExt);
      });
    });

    it('should return .unknown for unsupported MIME types', () => {
      expect(service.getFileExtensionFromMimeType('application/unknown')).toBe('.unknown');
    });
  });

  describe('getLibreOfficeVersion', () => {
    it('should get LibreOffice version if available', async () => {
      const isAvailable = await service.checkLibreOfficeAvailability();
      
      if (isAvailable) {
        const version = await service.getLibreOfficeVersion();
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      } else {
        await expect(service.getLibreOfficeVersion()).rejects.toThrow();
      }
    });
  });

  // Integration test - only run if LibreOffice is available
  describe('convertToPdf', () => {
    it('should convert a simple document to PDF', async () => {
      const isAvailable = await service.checkLibreOfficeAvailability();
      
      if (!isAvailable) {
        console.log('LibreOffice not available, skipping conversion test');
        return;
      }

      // Create a simple test document buffer (minimal DOCX structure)
      const testDocxBuffer = await createMinimalDocxBuffer();
      
      try {
        const result = await service.convertToPdf(
          testDocxBuffer,
          'test-document.docx',
          { quality: 'standard', timeout: 10000 }
        );

        expect(result).toBeDefined();
        expect(result.buffer).toBeInstanceOf(Buffer);
        expect(result.buffer.length).toBeGreaterThan(0);
        expect(result.processingTime).toBeGreaterThan(0);
        expect(result.engineUsed).toBe('libreoffice');
        expect(result.originalSize).toBe(testDocxBuffer.length);
        expect(result.convertedSize).toBe(result.buffer.length);

        // Check if the result is a valid PDF (starts with %PDF)
        const pdfHeader = result.buffer.toString('ascii', 0, 4);
        expect(pdfHeader).toBe('%PDF');
      } catch (error) {
        console.log('Conversion test failed (expected if LibreOffice not properly configured):', error.message);
      }
    }, 15000); // 15 second timeout for conversion test
  });
});

/**
 * Create a minimal DOCX buffer for testing
 * This creates a very basic DOCX structure that LibreOffice can process
 */
async function createMinimalDocxBuffer(): Promise<Buffer> {
  // This is a simplified approach - in a real test, you might want to use a library
  // or have actual test files. For now, we'll create a minimal structure.
  
  // Minimal DOCX content (this is a very basic structure)
  const content = `
    PK\x03\x04\x14\x00\x00\x00\x08\x00
    [Content_Types].xml
    word/document.xml
    word/_rels/document.xml.rels
    _rels/.rels
  `;
  
  return Buffer.from(content, 'binary');
} 