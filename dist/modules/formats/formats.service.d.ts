export interface SupportedFormat {
    extension: string;
    mime_type: string;
    description: string;
    max_size_mb: number;
    can_convert_to: string[];
}
export declare class FormatsService {
    private readonly supportedFormats;
    getSupportedConversions(): {
        supported_formats: SupportedFormat[];
        conversion_matrix: {};
        engines: {
            libreoffice: {
                version: string;
                status: string;
                supported_conversions: string[];
            };
        };
        limits: {
            max_file_size_mb: number;
            max_concurrent_conversions: number;
            timeout_seconds: number;
        };
    };
    private getConversionMatrix;
    isConversionSupported(fromFormat: string, toFormat: string): boolean;
    getFormatInfo(extension: string): SupportedFormat | undefined;
}
