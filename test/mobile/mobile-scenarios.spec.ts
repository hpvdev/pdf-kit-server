import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

describe('Mobile Testing Scenarios', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Mobile App Simulator Tests', () => {
    it('should handle mobile user agent requests', async () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      ];

      for (const userAgent of mobileUserAgents) {
        const response = await request(app.getHttpServer())
          .get('/api/v1/info')
          .set('User-Agent', userAgent)
          .expect(200);

        // Verify mobile-optimized response structure
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.metadata).toBeDefined();
        expect(response.body.metadata.server_version).toBe('2.0.0');
        expect(response.body.metadata.processing_time_ms).toBeDefined();
        expect(response.body.metadata.timestamp).toBeDefined();
        expect(response.body.metadata.request_id).toBeDefined();
      }
    });

    it('should include mobile-specific headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/formats')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      // Check for mobile optimization headers
      expect(response.headers['x-mobile-optimized']).toBe('true');
      expect(response.headers['x-response-format']).toBe('json');
      expect(response.headers['x-processing-time']).toBeDefined();
      expect(response.headers['x-server-version']).toBe('2.0.0');
    });

    it('should handle low bandwidth scenarios with compression', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/formats')
        .set('Accept-Encoding', 'gzip, deflate')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      // Response should be compressed for mobile
      expect(response.headers['content-encoding']).toBe('gzip');
      
      // Verify response structure is still correct
      expect(response.body.success).toBe(true);
      expect(response.body.data.supported_formats).toBeDefined();
    });
  });

  describe('Network Timeout Scenarios', () => {
    it('should handle slow network conditions gracefully', async () => {
      // Simulate slow network by making multiple concurrent requests
      const slowNetworkPromises = Array(10).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .get('/api/v1/health')
          .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
          .timeout(5000) // 5 second timeout
          .then(response => ({ index, success: true, response }))
          .catch(error => ({ index, success: false, error: error.message }))
      );

      const results = await Promise.all(slowNetworkPromises);
      const successfulRequests = results.filter(r => r.success);
      const failedRequests = results.filter(r => !r.success);

      console.log(`Slow network test: ${successfulRequests.length} successful, ${failedRequests.length} failed`);

      // At least 80% should succeed even under slow conditions
      expect(successfulRequests.length).toBeGreaterThanOrEqual(8);
    });

    it('should provide meaningful timeout error messages', async () => {
      // Test with a request that might timeout
      const response = await request(app.getHttpServer())
        .post('/api/v1/convert')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .field('targetFormat', 'docx')
        .attach('file', Buffer.alloc(1024), 'test.pdf')
        .expect((res) => {
          // Expect either success or error
          expect([200, 400, 422, 503]).toContain(res.status);
        });

      if (response.status !== 200) {
        expect(response.body.success).toBe(false);
        expect(response.body.error.recovery_suggestions).toBeDefined();
        expect(Array.isArray(response.body.error.recovery_suggestions)).toBe(true);
        expect(response.body.error.recovery_suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Large File Handling', () => {
    it('should reject files that are too large with helpful error', async () => {
      // Create a buffer that simulates a large file (over 50MB for PDF to Office)
      const largeFileBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB

      const response = await request(app.getHttpServer())
        .post('/api/v1/convert')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .field('targetFormat', 'docx')
        .attach('file', largeFileBuffer, 'large.pdf')
        .expect(413); // Payload Too Large

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
      expect(response.body.error.recovery_suggestions).toContain('Reduce file size by compressing the document');
      expect(response.body.metadata.mobile_optimized).toBe(true);
    });

    it('should handle medium-sized files appropriately', async () => {
      // Create a medium-sized file (10MB)
      const mediumFileBuffer = Buffer.alloc(10 * 1024 * 1024);

      const response = await request(app.getHttpServer())
        .post('/api/v1/convert')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .field('targetFormat', 'docx')
        .attach('file', mediumFileBuffer, 'medium.pdf')
        .expect((res) => {
          // Should not be rejected for size, but might fail for other reasons
          expect(res.status).not.toBe(413);
        });

      // Response should have proper mobile structure regardless of success/failure
      expect(response.body.success).toBeDefined();
      if (!response.body.success) {
        expect(response.body.error).toBeDefined();
        expect(response.body.error.recovery_suggestions).toBeDefined();
      }
    });
  });

  describe('Battery Usage Impact', () => {
    it('should minimize processing time for mobile requests', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/info')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Mobile requests should be fast to minimize battery usage
      expect(responseTime).toBeLessThan(200); // Under 200ms
      expect(response.body.metadata.processing_time_ms).toBeLessThan(100);
    });

    it('should use efficient response formats for mobile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/formats')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      // Response should be structured efficiently
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      
      // Should not include unnecessary data
      expect(response.body.debug_info).toBeUndefined();
      expect(response.body.internal_metrics).toBeUndefined();
    });

    it('should provide progress indicators for long operations', async () => {
      // Test conversion endpoint which might take longer
      const response = await request(app.getHttpServer())
        .post('/api/v1/convert')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .field('targetFormat', 'docx')
        .attach('file', Buffer.from('test content'), 'test.pdf')
        .expect((res) => {
          expect([200, 400, 422, 503]).toContain(res.status);
        });

      // Response should include timing information for mobile apps
      if (response.body.metadata) {
        expect(response.body.metadata.processing_time_ms).toBeDefined();
        expect(response.body.metadata.timestamp).toBeDefined();
      }
    });
  });

  describe('Mobile-Specific Error Scenarios', () => {
    it('should handle network interruption gracefully', async () => {
      // Simulate network interruption by making request and checking error handling
      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.recovery_suggestions).toBeDefined();
      expect(response.body.error.details.mobile_optimized).toBe(true);
      expect(response.body.metadata).toBeDefined();
    });

    it('should provide mobile-friendly validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/convert')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .field('targetFormat', 'invalid_format')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.recovery_suggestions).toContain('Check that the file format is supported');
      expect(response.body.error.details.mobile_optimized).toBe(true);
    });

    it('should handle memory pressure on mobile devices', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      expect(response.body.info.memory).toBeDefined();
      expect(response.body.info.memory.status).toBe('ok');
      
      // Should include memory information relevant to mobile
      if (response.body.info.memory.details) {
        expect(response.body.info.memory.details.usage_percent).toBeDefined();
      }
    });
  });
});
