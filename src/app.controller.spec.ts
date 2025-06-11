import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MemoryMonitorService } from './services/memory-monitor.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: MemoryMonitorService,
          useValue: {
            canAcceptNewConversion: jest.fn().mockReturnValue(true),
            checkMemoryThreshold: jest.fn().mockReturnValue(true),
            getActiveConversions: jest.fn().mockReturnValue(0),
            getMaxConcurrent: jest.fn().mockReturnValue(3),
            getMemoryStats: jest.fn().mockReturnValue({ used: 1000000 }),
            incrementActiveConversions: jest.fn(),
            decrementActiveConversions: jest.fn(),
            logMemoryUsage: jest.fn(),
            forceGarbageCollection: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
