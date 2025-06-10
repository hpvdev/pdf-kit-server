export declare class ConversionResponseDto {
    success: boolean;
    filename: string;
    content_type: string;
    file_size: number;
    data?: string;
    processing_time_ms: number;
    engine_used: string;
}
export declare class ConversionErrorDto {
    error: {
        code: string;
        message: string;
        details: {
            timestamp: string;
            path: string;
            method: string;
            [key: string]: any;
        };
    };
}
