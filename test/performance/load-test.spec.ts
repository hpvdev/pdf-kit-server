import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Load Testing', () => {
  let app: INestApplication;
  let testPdfBuffer: Buffer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create a test PDF buffer for testing
    testPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n' +
      '2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n' +
      '3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n' +
      '/Contents 4 0 R\n>>\nendobj\n' +
      '4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\n' +
      'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n' +
      '0000000115 00000 n \n0000000207 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n301\n%%EOF'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Concurrent Request Testing', () => {
    it('should handle 1 concurrent request successfully', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.status).toBe('ok');
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle 3 concurrent requests successfully', async () => {
      const startTime = Date.now();
      
      const promises = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalResponseTime = endTime - startTime;

      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
      });

      expect(totalResponseTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle 5 concurrent requests successfully', async () => {
      const startTime = Date.now();
      
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/formats')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalResponseTime = endTime - startTime;

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.supported_formats).toBeDefined();
      });

      expect(totalResponseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Memory Usage Testing', () => {
    it('should track memory usage during API calls', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make multiple API calls to test memory usage
      const promises = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/info')
          .expect(200)
      );

      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });

    it('should handle memory pressure gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.info.memory).toBeDefined();
      expect(response.body.info.memory.status).toBe('ok');
    });
  });

  describe('Response Time Measurements', () => {
    it('should measure response times for different endpoints', async () => {
      const endpoints = [
        '/api/v1/info',
        '/api/v1/health',
        '/api/v1/formats',
      ];

      const results = [];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results.push({
          endpoint,
          responseTime,
          hasMetadata: !!response.body.metadata,
          processingTime: response.body.metadata?.processing_time_ms,
        });

        // Each endpoint should respond within 500ms
        expect(responseTime).toBeLessThan(500);
      }

      // Log results for analysis
      console.log('Response Time Results:', results);
    });

    it('should maintain consistent response times under load', async () => {
      const responseTimes = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app.getHttpServer())
          .get('/api/v1/info')
          .expect(200);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      console.log(`Response Time Stats: avg=${averageTime}ms, min=${minTime}ms, max=${maxTime}ms`);

      // Average response time should be reasonable
      expect(averageTime).toBeLessThan(100);
      
      // Maximum response time shouldn't be too much higher than average
      expect(maxTime).toBeLessThan(averageTime * 3);
    });
  });

  describe('Error Rate Analysis', () => {
    it('should have low error rate under normal load', async () => {
      const totalRequests = 50;
      const promises = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < totalRequests; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/api/v1/health')
            .then(() => successCount++)
            .catch(() => errorCount++)
        );
      }

      await Promise.all(promises);

      const errorRate = (errorCount / totalRequests) * 100;
      
      console.log(`Error Rate: ${errorRate}% (${errorCount}/${totalRequests})`);
      
      // Error rate should be less than 5%
      expect(errorRate).toBeLessThan(5);
      expect(successCount).toBeGreaterThan(totalRequests * 0.95);
    });

    it('should handle invalid requests gracefully', async () => {
      const invalidEndpoints = [
        '/api/v1/nonexistent',
        '/api/v1/convert', // POST endpoint called with GET
        '/api/v1/invalid-path',
      ];

      for (const endpoint of invalidEndpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint);

        // Should return structured error response
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.error.code).toBeDefined();
        expect(response.body.error.recovery_suggestions).toBeDefined();
        expect(response.body.metadata).toBeDefined();
      }
    });
  });

  describe('File Upload Performance', () => {
    it('should handle small file uploads efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/api/v1/convert')
        .field('targetFormat', 'docx')
        .attach('file', testPdfBuffer, 'test.pdf')
        .expect((res) => {
          // Expect either success or specific error (LibreOffice not available)
          expect([200, 400, 422, 503]).toContain(res.status);
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // File upload should complete within reasonable time
      expect(responseTime).toBeLessThan(10000); // 10 seconds max

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      }
    });
  });
});
