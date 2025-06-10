import { FormatsService } from './formats.service';
export declare class FormatsController {
    private readonly formatsService;
    constructor(formatsService: FormatsService);
    getSupportedFormats(): {
        supported_formats: import("./formats.service").SupportedFormat[];
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
}
