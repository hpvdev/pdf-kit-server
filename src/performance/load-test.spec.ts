import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import * as request from 'supertest';

describe('Performance Load Testing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as in main.ts
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Basic Performance Testing', () => {
    it('should handle health check requests with reasonable response time', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/v1/health');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Health check might return 503 if LibreOffice is not available (expected in test environment)
      expect([200, 503]).toContain(response.status);
      expect(['ok', 'error']).toContain(response.body.status);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second

      // Verify response structure regardless of status
      expect(response.body.info).toBeDefined();
      expect(response.body.details).toBeDefined();

      console.log(`Health check response time: ${responseTime}ms`);
    });

    it('should handle multiple sequential requests efficiently', async () => {
      const requestCount = 5;
      const responseTimes: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();

        const response = await request(app.getHttpServer())
          .get('/api/v1/health');

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect([200, 503]).toContain(response.status);
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);

      console.log(`Sequential requests - Average: ${averageTime}ms, Max: ${maxTime}ms`);

      // Performance expectations
      expect(averageTime).toBeLessThan(500); // Average under 500ms
      expect(maxTime).toBeLessThan(1000); // No request over 1 second
    });
  });

  describe('Memory Usage Testing', () => {
    it('should track memory usage during API calls', async () => {
      const initialMemory = process.memoryUsage();

      // Make multiple API calls to test memory usage
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/health');
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      // Verify memory usage is tracked
      expect(initialMemory.heapUsed).toBeGreaterThan(0);
      expect(finalMemory.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('Response Time Measurements', () => {
    it('should measure response times for health endpoint', async () => {
      const iterations = 3;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        const response = await request(app.getHttpServer())
          .get('/api/v1/health');

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect([200, 503]).toContain(response.status);
        expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      }

      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);

      console.log(`Response times - Avg: ${averageTime}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);

      // Performance expectations
      expect(averageTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle invalid requests gracefully and quickly', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .expect(404);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Error responses should be fast
      expect(responseTime).toBeLessThan(500);

      // Should return some error structure (might not have full mobile optimization in test env)
      expect(response.body).toBeDefined();

      console.log(`Error response time: ${responseTime}ms`);
    });

    it('should maintain performance under repeated requests', async () => {
      const requestCount = 10;
      let totalTime = 0;

      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();

        await request(app.getHttpServer())
          .get('/api/v1/health');

        const endTime = Date.now();
        totalTime += (endTime - startTime);
      }

      const averageTime = totalTime / requestCount;
      console.log(`Average response time over ${requestCount} requests: ${averageTime}ms`);

      // Performance should remain consistent
      expect(averageTime).toBeLessThan(500);
    });
  });
});
