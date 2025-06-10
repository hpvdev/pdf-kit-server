"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWinstonLogger = exports.winstonConfig = void 0;
const nest_winston_1 = require("nest-winston");
const winston = require("winston");
const logFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
    const logObject = {
        timestamp,
        level,
        context,
        message,
        ...meta
    };
    if (trace) {
        logObject.trace = trace;
    }
    return JSON.stringify(logObject);
}));
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, context }) => {
    return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
}));
exports.winstonConfig = {
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: logFormat,
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: logFormat,
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'logs/exceptions.log',
            format: logFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: 'logs/rejections.log',
            format: logFormat,
        }),
    ],
};
const createWinstonLogger = () => {
    return nest_winston_1.WinstonModule.createLogger(exports.winstonConfig);
};
exports.createWinstonLogger = createWinstonLogger;
//# sourceMappingURL=winston.config.js.map