"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorResponse = {
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                details: {}
            }
        };
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                if ('error' in exceptionResponse) {
                    errorResponse = exceptionResponse;
                }
                else if ('message' in exceptionResponse) {
                    errorResponse = {
                        error: {
                            code: this.getErrorCode(status),
                            message: Array.isArray(exceptionResponse.message)
                                ? exceptionResponse.message.join(', ')
                                : exceptionResponse.message,
                            details: exceptionResponse
                        }
                    };
                }
                else {
                    errorResponse = {
                        error: {
                            code: this.getErrorCode(status),
                            message: exception.message,
                            details: exceptionResponse
                        }
                    };
                }
            }
            else {
                errorResponse = {
                    error: {
                        code: this.getErrorCode(status),
                        message: typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
                        details: {}
                    }
                };
            }
        }
        else if (exception instanceof Error) {
            if (exception.message.includes('File too large')) {
                status = common_1.HttpStatus.PAYLOAD_TOO_LARGE;
                errorResponse = {
                    error: {
                        code: 'FILE_TOO_LARGE',
                        message: 'File size exceeds the maximum allowed limit',
                        details: {
                            max_size_mb: 100,
                            suggestion: 'Please upload a smaller file'
                        }
                    }
                };
            }
            else if (exception.message.includes('timeout')) {
                status = common_1.HttpStatus.REQUEST_TIMEOUT;
                errorResponse = {
                    error: {
                        code: 'CONVERSION_TIMEOUT',
                        message: 'Conversion took too long and was terminated',
                        details: {
                            timeout_seconds: 30,
                            suggestion: 'Try with a smaller file or contact support'
                        }
                    }
                };
            }
            else {
                errorResponse = {
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: exception.message,
                        details: {}
                    }
                };
            }
        }
        if (!errorResponse.error) {
            errorResponse.error = {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                details: {}
            };
        }
        errorResponse.error.details = {
            ...errorResponse.error.details,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            request_id: this.generateRequestId(),
            user_agent: request.headers['user-agent'] || 'unknown',
            mobile_optimized: true,
        };
        errorResponse.error.recovery_suggestions = this.getMobileRecoverySuggestions(status, exception);
        const finalResponse = {
            success: false,
            error: errorResponse.error,
            metadata: {
                server_version: '2.0.0',
                processing_time_ms: Date.now() - (request['startTime'] || Date.now()),
                timestamp: new Date().toISOString(),
            }
        };
        this.logger.error(`${request.method} ${request.url} - ${status} - ${JSON.stringify(finalResponse)}`, exception instanceof Error ? exception.stack : 'Unknown error');
        response.status(status).json(finalResponse);
    }
    getErrorCode(status) {
        switch (status) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.PAYLOAD_TOO_LARGE:
                return 'FILE_TOO_LARGE';
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return 'TOO_MANY_REQUESTS';
            case common_1.HttpStatus.REQUEST_TIMEOUT:
                return 'CONVERSION_TIMEOUT';
            case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                return 'SERVICE_UNAVAILABLE';
            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }
    generateRequestId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getMobileRecoverySuggestions(status, exception) {
        const suggestions = [];
        switch (status) {
            case common_1.HttpStatus.PAYLOAD_TOO_LARGE:
                suggestions.push('Reduce file size by compressing the document', 'Split large documents into smaller parts', 'Use a different file format if possible', 'Check your internet connection stability');
                break;
            case common_1.HttpStatus.REQUEST_TIMEOUT:
                suggestions.push('Try again with a smaller file', 'Check your internet connection', 'Ensure the app is running in the foreground', 'Contact support if the issue persists');
                break;
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                suggestions.push('Wait a few minutes before trying again', 'Reduce the number of simultaneous conversions', 'Consider upgrading to a premium plan');
                break;
            case common_1.HttpStatus.BAD_REQUEST:
                suggestions.push('Check that the file format is supported', 'Ensure the file is not corrupted', 'Verify all required parameters are provided', 'Try uploading the file again');
                break;
            case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                suggestions.push('The service is temporarily unavailable', 'Try again in a few minutes', 'Check the app status page', 'Contact support if the issue continues');
                break;
            default:
                suggestions.push('Try the operation again', 'Restart the app if the problem persists', 'Check your internet connection', 'Contact support with the error details');
                break;
        }
        return suggestions;
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map