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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const swagger_1 = require("@nestjs/swagger");
const memory_monitor_service_1 = require("../../services/memory-monitor.service");
const conversion_engine_service_1 = require("../../services/conversion-engine.service");
let HealthController = class HealthController {
    health;
    memory;
    disk;
    memoryMonitor;
    conversionEngine;
    constructor(health, memory, disk, memoryMonitor, conversionEngine) {
        this.health = health;
        this.memory = memory;
        this.disk = disk;
        this.memoryMonitor = memoryMonitor;
        this.conversionEngine = conversionEngine;
    }
    check() {
        const memoryStats = this.memoryMonitor.getMemoryStats();
        return this.health.check([
            () => this.memory.checkHeap('memory_heap', 8 * 1024 * 1024 * 1024),
            () => this.memory.checkRSS('memory_rss', 16 * 1024 * 1024 * 1024),
            () => this.disk.checkStorage('storage', {
                path: '/',
                thresholdPercent: 0.9
            }),
            async () => {
                const engineInfo = await this.conversionEngine.getEngineInfo();
                const isReady = await this.conversionEngine.isEngineReady();
                return {
                    services: {
                        status: isReady ? 'up' : 'down',
                        libreoffice: engineInfo.isAvailable ? 'available' : 'unavailable',
                        libreoffice_version: engineInfo.libreOfficeVersion,
                        conversion_engine: isReady ? 'ready' : 'not_ready',
                        supported_formats: engineInfo.supportedFormats
                    }
                };
            },
            () => Promise.resolve({
                memory_usage: {
                    status: 'up',
                    used: `${(memoryStats.used / 1024 / 1024 / 1024).toFixed(1)}GB`,
                    free: `${(memoryStats.free / 1024 / 1024 / 1024).toFixed(1)}GB`,
                    total: `${(memoryStats.total / 1024 / 1024 / 1024).toFixed(1)}GB`,
                    usage_percent: `${memoryStats.usagePercent.toFixed(1)}%`
                }
            }),
            () => {
                const conversionStats = this.conversionEngine.getConversionStats();
                return Promise.resolve({
                    server_info: {
                        status: 'up',
                        active_conversions: conversionStats.activeConversions,
                        max_concurrent: conversionStats.maxConcurrentConversions,
                        memory_usage_mb: Math.round(conversionStats.memoryUsage / 1024 / 1024),
                        version: '2.0.0',
                        timestamp: new Date().toISOString()
                    }
                });
            }
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Health check endpoint',
        description: `
      Comprehensive health check for the PDF Kit Server.

      **Checks performed:**
      - Memory usage (heap and RSS)
      - Disk storage availability
      - LibreOffice service status
      - Conversion engine readiness
      - Active conversion statistics

      **Response codes:**
      - 200: All services healthy
      - 503: One or more services unhealthy
    `
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All services are healthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
                info: {
                    type: 'object',
                    properties: {
                        memory_heap: { type: 'object' },
                        memory_rss: { type: 'object' },
                        storage: { type: 'object' },
                        services: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', example: 'up' },
                                libreoffice: { type: 'string', example: 'available' },
                                libreoffice_version: { type: 'string', example: '7.0.4.2' },
                                conversion_engine: { type: 'string', example: 'ready' },
                                supported_formats: { type: 'array', items: { type: 'string' } }
                            }
                        },
                        memory_usage: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', example: 'up' },
                                used: { type: 'string', example: '1.2GB' },
                                free: { type: 'string', example: '6.8GB' },
                                total: { type: 'string', example: '8.0GB' },
                                usage_percent: { type: 'string', example: '15.0%' }
                            }
                        },
                        server_info: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', example: 'up' },
                                active_conversions: { type: 'number', example: 2 },
                                max_concurrent: { type: 'number', example: 3 },
                                memory_usage_mb: { type: 'number', example: 512 },
                                version: { type: 'string', example: '2.0.0' },
                                timestamp: { type: 'string', example: '2024-07-24T10:00:00.000Z' }
                            }
                        }
                    }
                },
                error: { type: 'object' },
                details: { type: 'object' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: 'One or more services are unhealthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'error' },
                info: { type: 'object' },
                error: {
                    type: 'object',
                    properties: {
                        services: {
                            type: 'object',
                            properties: {
                                status: { type: 'string', example: 'down' },
                                message: { type: 'string', example: 'LibreOffice service is not available' }
                            }
                        }
                    }
                },
                details: { type: 'object' }
            }
        }
    }),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.MemoryHealthIndicator,
        terminus_1.DiskHealthIndicator,
        memory_monitor_service_1.MemoryMonitorService,
        conversion_engine_service_1.ConversionEngineService])
], HealthController);
//# sourceMappingURL=health.controller.js.map