import * as winston from 'winston';
export declare const winstonConfig: {
    transports: (winston.transports.ConsoleTransportInstance | winston.transports.FileTransportInstance)[];
    exceptionHandlers: winston.transports.FileTransportInstance[];
    rejectionHandlers: winston.transports.FileTransportInstance[];
};
export declare const createWinstonLogger: () => import("@nestjs/common").LoggerService;
