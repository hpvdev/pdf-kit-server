import { Injectable, Logger } from '@nestjs/common';

export interface MemoryStats {
  used: number;
  free: number;
  total: number;
  usagePercent: number;
}

@Injectable()
export class MemoryMonitorService {
  private readonly logger = new Logger(MemoryMonitorService.name);
  private activeConversions = 0;
  private readonly maxConcurrent = 3;

  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;

    return {
      used: usedMem,
      free: freeMem,
      total: totalMem,
      usagePercent: (usedMem / totalMem) * 100
    };
  }

  getActiveConversions(): number {
    return this.activeConversions;
  }

  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  canAcceptNewConversion(): boolean {
    return this.activeConversions < this.maxConcurrent;
  }

  incrementActiveConversions(): void {
    this.activeConversions++;
    this.logger.log(`Active conversions: ${this.activeConversions}/${this.maxConcurrent}`);
  }

  decrementActiveConversions(): void {
    if (this.activeConversions > 0) {
      this.activeConversions--;
      this.logger.log(`Active conversions: ${this.activeConversions}/${this.maxConcurrent}`);
    }
  }

  logMemoryUsage(): void {
    const stats = this.getMemoryStats();
    const nodeMemory = process.memoryUsage();
    
    this.logger.log(`Memory Usage - System: ${(stats.used / 1024 / 1024 / 1024).toFixed(2)}GB/${(stats.total / 1024 / 1024 / 1024).toFixed(2)}GB (${stats.usagePercent.toFixed(1)}%)`);
    this.logger.log(`Memory Usage - Node.js Heap: ${(nodeMemory.heapUsed / 1024 / 1024).toFixed(2)}MB/${(nodeMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    this.logger.log(`Memory Usage - Node.js RSS: ${(nodeMemory.rss / 1024 / 1024).toFixed(2)}MB`);
  }

  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      this.logger.log('Forced garbage collection completed');
    } else {
      this.logger.warn('Garbage collection not available. Start Node.js with --expose-gc flag');
    }
  }

  checkMemoryThreshold(): boolean {
    const stats = this.getMemoryStats();
    const threshold = 85; // 85% threshold
    
    if (stats.usagePercent > threshold) {
      this.logger.warn(`Memory usage is high: ${stats.usagePercent.toFixed(1)}% (threshold: ${threshold}%)`);
      this.forceGarbageCollection();
      return false;
    }
    
    return true;
  }
} 