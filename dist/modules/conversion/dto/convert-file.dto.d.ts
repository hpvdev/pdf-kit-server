export declare enum OutputFormat {
    PDF = "pdf",
    DOCX = "docx",
    XLSX = "xlsx",
    PPTX = "pptx"
}
export declare enum ResponseFormat {
    BINARY = "binary",
    BASE64 = "base64"
}
export declare enum Quality {
    STANDARD = "standard",
    HIGH = "high"
}
export declare class ConvertFileDto {
    output_format: OutputFormat;
    response_format?: ResponseFormat;
    quality?: Quality;
}
