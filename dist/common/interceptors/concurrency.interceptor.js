"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const memory_monitor_service_1 = require("../../services/memory-monitor.service");
let ConcurrencyInterceptor = class ConcurrencyInterceptor {
    memoryMonitor;
    constructor(memoryMonitor) {
        this.memoryMonitor = memoryMonitor;
    }
    intercept(context, next) {
        if (!this.memoryMonitor.canAcceptNewConversion()) {
            throw new common_1.HttpException({
                error: {
                    code: 'TOO_MANY_CONCURRENT_REQUESTS',
                    message: 'Server is currently processing the maximum number of concurrent conversions. Please try again later.',
                    details: {
                        active_conversions: this.memoryMonitor.getActiveConversions(),
                        max_concurrent: this.memoryMonitor.getMaxConcurrent(),
                        retry_after_seconds: 30
                    }
                }
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (!this.memoryMonitor.checkMemoryThreshold()) {
            throw new common_1.HttpException({
                error: {
                    code: 'MEMORY_THRESHOLD_EXCEEDED',
                    message: 'Server memory usage is too high. Please try again later.',
                    details: {
                        memory_usage: this.memoryMonitor.getMemoryStats(),
                        retry_after_seconds: 60
                    }
                }
            }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        this.memoryMonitor.incrementActiveConversions();
        this.memoryMonitor.logMemoryUsage();
        return next.handle().pipe((0, operators_1.catchError)((error) => {
            this.memoryMonitor.decrementActiveConversions();
            return (0, rxjs_1.throwError)(() => error);
        }), (0, operators_1.finalize)(() => {
            this.memoryMonitor.decrementActiveConversions();
            this.memoryMonitor.forceGarbageCollection();
            this.memoryMonitor.logMemoryUsage();
        }));
    }
};
exports.ConcurrencyInterceptor = ConcurrencyInterceptor;
exports.ConcurrencyInterceptor = ConcurrencyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [memory_monitor_service_1.MemoryMonitorService])
], ConcurrencyInterceptor);
//# sourceMappingURL=concurrency.interceptor.js.map