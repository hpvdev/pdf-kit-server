"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MemoryMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryMonitorService = void 0;
const common_1 = require("@nestjs/common");
let MemoryMonitorService = MemoryMonitorService_1 = class MemoryMonitorService {
    logger = new common_1.Logger(MemoryMonitorService_1.name);
    activeConversions = 0;
    maxConcurrent = 3;
    getMemoryStats() {
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
    getActiveConversions() {
        return this.activeConversions;
    }
    getMaxConcurrent() {
        return this.maxConcurrent;
    }
    canAcceptNewConversion() {
        return this.activeConversions < this.maxConcurrent;
    }
    incrementActiveConversions() {
        this.activeConversions++;
        this.logger.log(`Active conversions: ${this.activeConversions}/${this.maxConcurrent}`);
    }
    decrementActiveConversions() {
        if (this.activeConversions > 0) {
            this.activeConversions--;
            this.logger.log(`Active conversions: ${this.activeConversions}/${this.maxConcurrent}`);
        }
    }
    logMemoryUsage() {
        const stats = this.getMemoryStats();
        const nodeMemory = process.memoryUsage();
        this.logger.log(`Memory Usage - System: ${(stats.used / 1024 / 1024 / 1024).toFixed(2)}GB/${(stats.total / 1024 / 1024 / 1024).toFixed(2)}GB (${stats.usagePercent.toFixed(1)}%)`);
        this.logger.log(`Memory Usage - Node.js Heap: ${(nodeMemory.heapUsed / 1024 / 1024).toFixed(2)}MB/${(nodeMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`);
        this.logger.log(`Memory Usage - Node.js RSS: ${(nodeMemory.rss / 1024 / 1024).toFixed(2)}MB`);
    }
    forceGarbageCollection() {
        if (global.gc) {
            global.gc();
            this.logger.log('Forced garbage collection completed');
        }
        else {
            this.logger.warn('Garbage collection not available. Start Node.js with --expose-gc flag');
        }
    }
    checkMemoryThreshold() {
        const stats = this.getMemoryStats();
        const threshold = 85;
        if (stats.usagePercent > threshold) {
            this.logger.warn(`Memory usage is high: ${stats.usagePercent.toFixed(1)}% (threshold: ${threshold}%)`);
            this.forceGarbageCollection();
            return false;
        }
        return true;
    }
};
exports.MemoryMonitorService = MemoryMonitorService;
exports.MemoryMonitorService = MemoryMonitorService = MemoryMonitorService_1 = __decorate([
    (0, common_1.Injectable)()
], MemoryMonitorService);
//# sourceMappingURL=memory-monitor.service.js.map