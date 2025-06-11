# Kế hoạch Xây dựng Backend Chuyển đổi PDF Self-Hosted cho Mobile App

**Tác giả:** AI - Kiến trúc sư phần mềm
**Ngày tạo:** 24/07/2024
**Phiên bản:** 2.0 - Mobile Optimized

---

## 1. Tổng quan

Tài liệu này mô tả kế hoạch kiến trúc và lộ trình phát triển cho hệ thống backend self-hosted **Stateless**, chuyên xử lý các tác vụ chuyển đổi định dạng tài liệu giữa PDF và các định dạng Microsoft Office (Word, Excel, PowerPoint) dành cho **Mobile Applications**.

Mục tiêu chính là xây dựng một hệ thống **đơn giản, nhanh chóng, bảo mật cao** với khả năng xử lý real-time, không lưu trữ dữ liệu người dùng, phù hợp cho mobile apps với file size vừa phải.

## 2. Yêu cầu

### 2.1. Yêu cầu chức năng (Functional Requirements)

Hệ thống phải cung cấp các API để thực hiện các chức năng chuyển đổi sau:

- **PDF to Word:** Chuyển đổi file `.pdf` thành file `.docx` (< 50MB).
- **PDF to Excel:** Chuyển đổi file `.pdf` thành file `.xlsx` (< 50MB).
- **PDF to PowerPoint:** Chuyển đổi file `.pdf` thành file `.pptx` (< 50MB).
- **Word to PDF:** Chuyển đổi file `.docx` thành file `.pdf` (< 100MB).
- **Excel to PDF:** Chuyển đổi file `.xlsx` thành file `.pdf` (< 100MB).
- **PowerPoint to PDF:** Chuyển đổi file `.pptx` thành file `.pdf` (< 100MB).

### 2.2. Yêu cầu phi chức năng (Non-Functional Requirements)

- **Độ chính xác cao:** Kết quả chuyển đổi phải giữ lại định dạng, layout, font chữ, hình ảnh, bảng biểu một cách chính xác nhất có thể.
- **Hiệu năng Real-time:** Xử lý và trả về kết quả ngay lập tức (< 30 giây cho file 50MB).
- **Bảo mật tuyệt đối:** Không lưu trữ dữ liệu người dùng, xử lý hoàn toàn trong memory.
- **Đơn giản triển khai:** Single service, minimal dependencies, dễ dàng deploy với Docker.
- **Mobile-friendly:** API tối ưu cho mobile apps với response format linh hoạt (binary/base64).
- **Resource efficient:** Tối ưu memory usage, tự động cleanup sau mỗi request.

## 3. Thiết kế Kiến trúc - Stateless Real-time Processing

Kiến trúc **Stateless Real-time Processing** - xử lý trực tiếp trong memory và trả về kết quả ngay lập tức.

```
[Mobile App] ──HTTP POST──> [API Server] ──Process──> [Conversion Engine] ──Return──> [Mobile App]
                                │                           │
                                └── In-Memory Buffer ───────┘
```

### 3.1. Đặc điểm chính

1. **API Server:**
   - Nhận file qua HTTP POST request
   - Xử lý file hoàn toàn trong memory (RAM)
   - Không lưu file tạm thời trên disk
   - Trả về kết quả trực tiếp trong response body
   - Timeout protection cho các request dài (30s timeout)
   - Concurrency control để tránh memory overflow

2. **In-Memory Processing:**
   - File được load vào memory buffer
   - Conversion engine xử lý trực tiếp từ memory
   - Kết quả được tạo trong memory
   - Cleanup tự động sau khi response
   - Memory monitoring và garbage collection

3. **Synchronous Response:**
   - Client gửi request và chờ response
   - Response chứa file đã convert (base64 hoặc binary)
   - Không cần polling hay job tracking
   - Immediate feedback cho user
   - Progress indication qua WebSocket (optional)

### 3.2. Conversion Engine

- **Office to PDF:** Sử dụng **LibreOffice** ở chế độ headless với `unoconv`
- **PDF to Office:** Kết hợp **PyMuPDF (fitz)** + **pdf2docx** + **pdf-lib**
- **Fallback mechanism:** Tự động retry với parameters khác nếu conversion đầu tiên fail

### 3.3. Ưu điểm

- **Đơn giản:** Không cần queue, storage, job management
- **Bảo mật cao:** Không lưu trữ dữ liệu người dùng
- **Real-time:** Kết quả trả về ngay lập tức
- **Privacy-friendly:** Dữ liệu chỉ tồn tại trong memory
- **Dễ deploy:** Single service, ít dependencies
- **Mobile-optimized:** API design phù hợp cho mobile apps

### 3.4. Giới hạn

- **File size:** Tối đa 50MB cho PDF to Office, 100MB cho Office to PDF
- **Concurrency:** Tối đa 3-5 conversions đồng thời
- **Memory:** Cần 16GB RAM để xử lý optimal
- **Timeout:** 30 giây timeout cho mỗi conversion

## 4. Công nghệ sử dụng

| Hạng mục | Lựa chọn cụ thể | Lý do lựa chọn |
|---|---|---|
| **Ngôn ngữ Backend** | **Node.js 20 LTS + NestJS** | Framework enterprise-grade với TypeScript, dependency injection, modular architecture, built-in validation, swagger documentation, phù hợp cho scalable API. |
| **Conversion Engine** | **LibreOffice Headless + unoconv**<br>**PyMuPDF + pdf2docx** | LibreOffice cho Office to PDF chất lượng cao. PyMuPDF + pdf2docx cho PDF to Office với độ chính xác tốt. |
| **Memory Management** | **Node.js Streams + Buffer** | Xử lý file lớn hiệu quả trong memory, streaming để tối ưu RAM usage. |
| **Concurrency Control** | **NestJS Interceptors + Bull Queue** | Giới hạn concurrent requests với interceptors, queue management cho background processing. |
| **File Processing** | **NestJS File Upload + Multer** | Built-in file upload với @UseInterceptors(FileInterceptor), memory storage configuration. |
| **Validation** | **Class-validator + Class-transformer** | Decorator-based validation, DTO classes, automatic transformation và validation. |
| **Timeout Handling** | **NestJS Timeout Interceptor** | Built-in timeout handling với @Timeout decorator, graceful cleanup. |
| **Monitoring** | **PM2 + NestJS Health Check** | Process management, built-in health check module, custom metrics. |
| **Logging** | **NestJS Logger + Winston** | Built-in logger service, structured logging, request context tracking. |
| **Containerization** | **Docker + Alpine Linux** | Lightweight container, fast startup, minimal resource usage. |
| **Rate Limiting** | **NestJS Throttler** | Built-in rate limiting với @Throttle decorator, flexible configuration. |
| **Authentication** | **NestJS Guards + JWT** | Built-in authentication guards, JWT strategy, API key validation. |

### 4.1. Cấu hình đặc biệt

#### Memory Management
```typescript
// main.ts - NestJS memory configuration
process.env.NODE_OPTIONS = '--max-old-space-size=8192'; // 8GB heap

// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

#### Request Limits & File Upload
```typescript
// main.ts - Global configuration
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Request size limits
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));
  
  await app.listen(3000);
}

// conversion.controller.ts - File upload configuration
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('api/v1')
export class ConversionController {
  @Post('convert')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max
      files: 1
    }
  }))
  async convertFile(@UploadedFile() file: Express.Multer.File) {
    // Process conversion
  }
}
```

#### Concurrency Control với NestJS
```typescript
// concurrency.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class ConcurrencyInterceptor implements NestInterceptor {
  private activeRequests = 0;
  private readonly maxConcurrent = 3;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.activeRequests >= this.maxConcurrent) {
      throw new Error('Too many concurrent requests');
    }

    this.activeRequests++;
    
    return next.handle().pipe(
      finalize(() => {
        this.activeRequests--;
      })
    );
  }
}

// conversion.controller.ts - Usage
@Controller('api/v1')
@UseInterceptors(ConcurrencyInterceptor)
export class ConversionController {
  // Controller methods
}
```

### 4.2. NestJS Architecture Structure

```
src/
├── app.module.ts                 # Root module
├── main.ts                       # Application entry point
├── common/                       # Shared utilities
│   ├── decorators/              # Custom decorators
│   ├── filters/                 # Exception filters
│   ├── guards/                  # Authentication guards
│   ├── interceptors/            # Request/Response interceptors
│   └── pipes/                   # Validation pipes
├── modules/
│   ├── conversion/              # Conversion module
│   │   ├── conversion.controller.ts
│   │   ├── conversion.service.ts
│   │   ├── conversion.module.ts
│   │   └── dto/                 # Data Transfer Objects
│   │       ├── convert-file.dto.ts
│   │       └── conversion-response.dto.ts
│   ├── health/                  # Health check module
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── formats/                 # Supported formats module
│       ├── formats.controller.ts
│       ├── formats.service.ts
│       └── formats.module.ts
├── services/                    # Core services
│   ├── conversion-engine.service.ts
│   ├── memory-monitor.service.ts
│   └── file-processor.service.ts
└── config/                      # Configuration
    ├── app.config.ts
    └── multer.config.ts
```

### 4.3. Resource Requirements

- **CPU:** 8 cores recommended (conversion intensive)
- **RAM:** 16GB minimum (8GB app + 8GB concurrent conversions)
- **Storage:** 20GB (OS + application only)
- **Network:** 100Mbps+ cho file upload/download
- **Cost:** $80-150/month cho VPS với high RAM

## 5. Thiết kế API (RESTful API)

### 5.1. Core Conversion API

#### `POST /api/v1/convert`

-   **Description:** Chuyển đổi file và trả về kết quả ngay lập tức.
-   **Request Body:** `multipart/form-data`
    -   `file`: File cần chuyển đổi (max 50MB cho PDF to Office, 100MB cho Office to PDF).
    -   `output_format`: Định dạng mong muốn (`docx`, `xlsx`, `pptx`, `pdf`).
    -   `response_format`: Format trả về (`binary`, `base64`). Mặc định là `binary`.
    -   `quality`: Chất lượng conversion (`standard`, `high`). Mặc định là `standard`.
-   **Headers:**
    -   `Content-Type: multipart/form-data`
    -   `Accept: application/octet-stream` (binary) hoặc `application/json` (base64)
-   **Success Response (200 OK):**
    
    **Binary Response (Recommended for mobile):**
    ```
    Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    Content-Disposition: attachment; filename="converted-file.docx"
    Content-Length: 1234567
    X-Processing-Time: 2500
    X-Engine-Used: libreoffice
    
    [Binary file data]
    ```
    
    **Base64 Response:**
    ```json
    {
      "success": true,
      "filename": "converted-file.docx",
      "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "file_size": 1234567,
      "data": "UEsDBBQAAAAIAOuFt1QAAAA...",
      "processing_time_ms": 2500,
      "engine_used": "libreoffice"
    }
    ```

### 5.2. Utility Endpoints

#### `GET /api/v1/health`

-   **Description:** Health check endpoint.
-   **Success Response (200 OK):**
    ```json
    {
      "status": "healthy",
      "timestamp": "2024-07-24T10:00:00Z",
      "version": "2.0.0",
      "memory_usage": {
        "used": "2.1GB",
        "free": "13.9GB",
        "total": "16GB"
      },
      "services": {
        "libreoffice": "available",
        "conversion_engine": "ready"
      },
      "active_conversions": 1,
      "max_concurrent": 3
    }
    ```

#### `GET /api/v1/formats`

-   **Description:** Lấy danh sách các format được hỗ trợ.
-   **Success Response (200 OK):**
    ```json
    {
      "supported_conversions": [
        {
          "from": "pdf",
          "to": ["docx", "xlsx", "pptx"],
          "max_file_size_mb": 50,
          "estimated_time_seconds": "5-30"
        },
        {
          "from": "docx",
          "to": ["pdf"],
          "max_file_size_mb": 100,
          "estimated_time_seconds": "2-10"
        },
        {
          "from": "xlsx",
          "to": ["pdf"],
          "max_file_size_mb": 100,
          "estimated_time_seconds": "3-15"
        },
        {
          "from": "pptx",
          "to": ["pdf"],
          "max_file_size_mb": 100,
          "estimated_time_seconds": "5-20"
        }
      ]
    }
    ```

### 5.3. Error Responses

#### Client Errors (4xx)
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds limit. Maximum 50MB for PDF to Office conversion.",
    "details": {
      "received_size_mb": 75,
      "max_size_mb": 50,
      "conversion_type": "pdf_to_docx"
    }
  }
}
```

#### Server Errors (5xx)
```json
{
  "error": {
    "code": "CONVERSION_TIMEOUT",
    "message": "Conversion took too long and was terminated.",
    "details": {
      "timeout_seconds": 30,
      "file_size_mb": 45,
      "retry_suggestion": "Try with a smaller file or lower quality setting"
    }
  }
}
```

### 5.4. Rate Limiting

- **Limit:** 50 requests/hour per IP
- **Headers:**
  ```
  X-RateLimit-Limit: 50
  X-RateLimit-Remaining: 45
  X-RateLimit-Reset: 1627123456
  ``` 

## 6. Kế hoạch phát triển (Roadmap) - Mobile App Focus

### Giai đoạn 1: Thiết lập Core và POC - (1 tuần)

#### 6.1.1. Chuẩn bị môi trường
- [x] **Khởi tạo dự án**
  - [x] Tạo repository Git với cấu trúc NestJS
  - [x] Khởi tạo NestJS project với `@nestjs/cli`
  - [x] Setup dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
  - [x] Cài đặt thêm: `@nestjs/config`, `@nestjs/terminus`, `@nestjs/throttler`
  - [x] Thiết lập TypeScript, ESLint, Prettier cho NestJS
  - [x] Cấu hình `.env.example`, `nest-cli.json`

- [x] **Docker Setup**
  - [x] Viết `Dockerfile` với Alpine Linux + Node.js
  - [x] Tạo `docker-compose.yml` đơn giản (single service)
  - [x] Cài đặt LibreOffice headless trong container
  - [ ] Test container build và startup

#### 6.1.2. NestJS Server cơ bản
- [x] **API Server Setup**
  - [x] Khởi tạo NestJS project với CLI
  - [x] Setup AppModule, ConfigModule, và basic structure
  - [x] Cấu hình CORS, global pipes, interceptors
  - [x] Implement HealthModule với @nestjs/terminus
  - [x] Setup NestJS Logger với Winston integration

- [x] **Memory-based File Handling**
  - [x] Configure FileInterceptor với memoryStorage
  - [x] Implement validation DTOs với class-validator
  - [x] Setup ConcurrencyInterceptor cho request limiting
  - [x] Memory monitoring service và cleanup utilities

### Giai đoạn 2: Conversion Engine - (1.5 tuần)

#### 6.2.1. LibreOffice Integration
- [x] **Office to PDF**
  - [x] Implement LibreOffice wrapper cho in-memory processing
  - [x] Support Word, Excel, PowerPoint to PDF
  - [x] Error handling và timeout protection
  - [x] Quality optimization parameters

- [x] **Testing Office Conversions**
  - [x] Test với LibreOffice availability detection
  - [x] Measure conversion time và memory usage
  - [x] Validate output quality với unit tests
  - [x] Document performance baselines

#### 6.2.2. PDF to Office (Basic)
- [ ] **PDF Analysis**
  - [ ] Integrate PyMuPDF cho text extraction
  - [ ] Basic image extraction
  - [ ] Simple table detection
  - [ ] Layout analysis cơ bản

- [ ] **PDF to Word**
  - [ ] Integrate pdf2docx library
  - [ ] Text formatting preservation
  - [ ] Basic image handling
  - [ ] Simple table reconstruction

### Giai đoạn 3: API Implementation - (1 tuần)

#### 6.3.1. Core API
- [ ] **Conversion Controller**
  - [ ] Implement ConversionController với `POST /api/v1/convert`
  - [ ] Support binary và base64 response với custom decorators
  - [ ] Request validation với DTOs và class-validator
  - [ ] Exception filters cho proper error handling

- [ ] **Utility Controllers**
  - [ ] Implement HealthController với @nestjs/terminus
  - [ ] Implement FormatsController với supported conversions
  - [ ] Rate limiting với @nestjs/throttler
  - [ ] Auto-generated API documentation với Swagger

#### 6.3.2. Mobile Optimization
- [ ] **Response Optimization**
  - [ ] Custom response interceptors cho binary/base64
  - [ ] Implement compression middleware
  - [ ] Add processing time metrics với custom decorators
  - [ ] Response transformation pipes

- [ ] **Error Handling**
  - [ ] Global exception filters cho mobile-friendly errors
  - [ ] Structured error DTOs
  - [ ] Timeout interceptors với graceful cleanup
  - [ ] Memory overflow guards và monitoring

### Giai đoạn 4: Testing và Optimization - (0.5 tuần)

#### 6.4.1. Performance Testing
- [ ] **Load Testing**
  - [ ] Test concurrent requests (1, 3, 5 simultaneous)
  - [ ] Memory usage under load
  - [ ] Response time measurements
  - [ ] Error rate analysis

- [ ] **Mobile Testing**
  - [ ] Test với mobile app simulator
  - [ ] Network timeout scenarios
  - [ ] Large file handling
  - [ ] Battery usage impact

#### 6.4.2. Production Readiness
- [ ] **Deployment**
  - [ ] Production Docker configuration với multi-stage build
  - [ ] Environment configuration với @nestjs/config
  - [ ] PM2 ecosystem file cho NestJS
  - [ ] Health checks và monitoring setup

- [ ] **Documentation**
  - [ ] Swagger/OpenAPI documentation tự động
  - [ ] Mobile integration guide với code examples
  - [ ] NestJS-specific troubleshooting guide
  - [ ] Performance recommendations và best practices

### Giai đoạn 5: Advanced Features - (Optional, 1 tuần)

#### 6.5.1. Quality Improvements
- [ ] **Enhanced PDF to Office**
  - [ ] Better table extraction
  - [ ] Improved image positioning
  - [ ] Font handling improvements
  - [ ] Layout preservation enhancements

- [ ] **Fallback Mechanisms**
  - [ ] Multiple conversion attempts
  - [ ] Quality degradation options
  - [ ] Alternative libraries integration
  - [ ] Error recovery strategies

#### 6.5.2. Mobile Features
- [ ] **Progress Tracking**
  - [ ] WebSocket Gateway với @nestjs/websockets
  - [ ] Real-time progress events
  - [ ] Estimated time remaining calculations
  - [ ] Cancellation support với AbortController

- [ ] **Caching**
  - [ ] Cache Manager với @nestjs/cache-manager
  - [ ] File hash-based cache keys
  - [ ] TTL-based cache expiration
  - [ ] Memory-efficient cache interceptors

## 7. Timeline Summary

| Giai đoạn | Thời gian | Deliverables |
|-----------|-----------|--------------|
| **1. Setup & POC** | 1 tuần | Docker container, NestJS server, basic file handling |
| **2. Conversion Engine** | 1.5 tuần | LibreOffice integration, PDF processing, basic conversions |
| **3. API Implementation** | 1 tuần | Complete NestJS API, mobile optimization, error handling |
| **4. Testing & Deploy** | 0.5 tuần | Performance testing, production deployment |
| **5. Advanced Features** | 1 tuần (optional) | Enhanced quality, progress tracking, caching |

**Total: 4-5 tuần** cho MVP hoàn chỉnh

## 8. Rủi ro và Giải pháp

- **Rủi ro:** Memory overflow với file lớn hoặc nhiều concurrent requests
  - **Giải pháp:** Strict file size limits, concurrency control, memory monitoring

- **Rủi ro:** Conversion timeout trên mobile networks chậm
  - **Giải pháp:** Optimized processing, compression, timeout warnings

- **Rủi ro:** Chất lượng PDF to Office không đạt yêu cầu
  - **Giải pháp:** Multiple conversion libraries, quality settings, user feedback

- **Rủi ro:** Server crash do memory leaks
  - **Giải pháp:** Automatic cleanup, PM2 restart, memory limits

--- 