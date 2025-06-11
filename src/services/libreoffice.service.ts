import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

export interface ConversionOptions {
  quality?: 'standard' | 'high';
  timeout?: number;
  preserveFormatting?: boolean;
}

export interface ConversionResult {
  buffer: Buffer;
  processingTime: number;
  engineUsed: string;
  originalSize: number;
  convertedSize: number;
}

@Injectable()
export class LibreOfficeService {
  private readonly logger = new Logger(LibreOfficeService.name);
  private readonly tempDir = os.tmpdir();
  private readonly defaultTimeout = 30000; // 30 seconds

  /**
   * Convert Office document to PDF using LibreOffice headless
   */
  async convertToPdf(
    fileBuffer: Buffer,
    originalFilename: string,
    options: ConversionOptions = {},
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const sessionId = uuidv4();
    
    this.logger.log(`Starting conversion session ${sessionId} for file: ${originalFilename}`);

    // Create temporary directories for this conversion
    const sessionTempDir = path.join(this.tempDir, `libreoffice-${sessionId}`);
    const inputFile = path.join(sessionTempDir, originalFilename);
    const outputDir = path.join(sessionTempDir, 'output');

    try {
      // Create temporary directories
      await fs.mkdir(sessionTempDir, { recursive: true });
      await fs.mkdir(outputDir, { recursive: true });

      // Write input file to temp directory
      await fs.writeFile(inputFile, fileBuffer);
      
      this.logger.debug(`Input file written: ${inputFile} (${fileBuffer.length} bytes)`);

      // Execute LibreOffice conversion
      const pdfBuffer = await this.executeLibreOfficeConversion(
        inputFile,
        outputDir,
        options,
        sessionId,
      );

      const processingTime = Date.now() - startTime;
      
      this.logger.log(`Conversion completed for session ${sessionId} in ${processingTime}ms`);

      return {
        buffer: pdfBuffer,
        processingTime,
        engineUsed: 'libreoffice',
        originalSize: fileBuffer.length,
        convertedSize: pdfBuffer.length,
      };

    } catch (error) {
      this.logger.error(`Conversion failed for session ${sessionId}:`, error);
      throw error;
    } finally {
      // Cleanup temporary files
      await this.cleanupTempFiles(sessionTempDir);
    }
  }

  /**
   * Execute LibreOffice conversion command
   */
  private async executeLibreOfficeConversion(
    inputFile: string,
    outputDir: string,
    options: ConversionOptions,
    sessionId: string,
  ): Promise<Buffer> {
    const timeout = options.timeout || this.defaultTimeout;
    
    // Build LibreOffice command arguments
    const args = [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      outputDir,
      inputFile,
    ];

    // Add quality-specific options
    if (options.quality === 'high') {
      args.push('--infilter=writer_pdf_Export');
    }

    this.logger.debug(`Executing LibreOffice command for session ${sessionId}:`, args);

    return new Promise((resolve, reject) => {
      const process = spawn('libreoffice', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', async (code) => {
        if (code === 0) {
          try {
            // Find the generated PDF file
            const pdfBuffer = await this.findAndReadPdfOutput(outputDir, sessionId);
            resolve(pdfBuffer);
          } catch (error) {
            reject(new Error(`Failed to read PDF output: ${error.message}`));
          }
        } else {
          reject(new Error(`LibreOffice process exited with code ${code}. stderr: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to start LibreOffice process: ${error.message}`));
      });

      // Handle timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
          reject(new Error(`LibreOffice conversion timed out after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  /**
   * Find and read the generated PDF file from output directory
   */
  private async findAndReadPdfOutput(outputDir: string, sessionId: string): Promise<Buffer> {
    try {
      const files = await fs.readdir(outputDir);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

      if (pdfFiles.length === 0) {
        throw new Error('No PDF file generated');
      }

      if (pdfFiles.length > 1) {
        this.logger.warn(`Multiple PDF files found for session ${sessionId}, using first one`);
      }

      const pdfPath = path.join(outputDir, pdfFiles[0]);
      const pdfBuffer = await fs.readFile(pdfPath);

      this.logger.debug(`PDF file read: ${pdfPath} (${pdfBuffer.length} bytes)`);

      return pdfBuffer;
    } catch (error) {
      throw new Error(`Failed to read PDF output: ${error.message}`);
    }
  }

  /**
   * Clean up temporary files and directories
   */
  private async cleanupTempFiles(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      this.logger.debug(`Cleaned up temp directory: ${tempDir}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
    }
  }

  /**
   * Check if LibreOffice is available
   */
  async checkLibreOfficeAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn('libreoffice', ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });

      process.on('error', () => {
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!process.killed) {
          process.kill();
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * Get LibreOffice version information
   */
  async getLibreOfficeVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn('libreoffice', ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error('Failed to get LibreOffice version'));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Validate if file format is supported for conversion
   */
  isSupportedFormat(mimeType: string): boolean {
    const supportedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.oasis.opendocument.text', // .odt
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'application/vnd.oasis.opendocument.presentation', // .odp
    ];

    return supportedMimeTypes.includes(mimeType);
  }

  /**
   * Get file extension from MIME type
   */
  getFileExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension = {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/msword': '.doc',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.oasis.opendocument.text': '.odt',
      'application/vnd.oasis.opendocument.spreadsheet': '.ods',
      'application/vnd.oasis.opendocument.presentation': '.odp',
    };

    return mimeToExtension[mimeType] || '.unknown';
  }
} 