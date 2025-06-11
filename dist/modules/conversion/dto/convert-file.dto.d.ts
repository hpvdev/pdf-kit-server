export declare class ConvertFileDto {
    targetFormat: string;
    responseFormat?: 'binary' | 'base64';
    quality?: 'standard' | 'high';
    timeout?: number;
    preserveFormatting?: boolean;
    file: any;
}
