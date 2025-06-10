import { AppService } from './app.service';
import { ConvertFileDto } from './modules/conversion/dto/convert-file.dto';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getServerInfo(): {
        name: string;
        version: string;
        description: string;
        features: string[];
        endpoints: {
            health: string;
            formats: string;
            convert: string;
        };
    };
    testFileUpload(file: Express.Multer.File, body: ConvertFileDto): {
        success: boolean;
        message: string;
        file_info: {
            original_name: string;
            size_mb: number;
            mime_type: string;
            buffer_length: number;
        };
        conversion_params: ConvertFileDto;
    };
}
