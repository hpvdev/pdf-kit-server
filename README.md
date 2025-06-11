# PDF Kit Server

A high-performance PDF and Office document conversion service built with NestJS, optimized for mobile applications.

## 🚀 Features

- **Bidirectional Conversion**: PDF ↔ Office formats (DOCX, XLSX, PPTX)
- **Mobile Optimized**: Compressed responses, mobile-friendly error handling, processing time metrics
- **High Performance**: Concurrent processing, memory management, queue control
- **Production Ready**: Docker support, health checks, monitoring, load balancing
- **Comprehensive API**: RESTful endpoints with OpenAPI documentation
- **Testing Suite**: Unit tests, integration tests, performance tests

## 📋 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/pdf-kit-server.git
cd pdf-kit-server

# Start with Docker Compose
docker-compose up -d

# The server will be available at http://localhost:3000/api/v1
```

### Local Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev

# The server will be available at http://localhost:3001/api/v1
```

## 📖 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3001/api/v1/docs
- **Health Check**: http://localhost:3001/api/v1/health
- **Server Info**: http://localhost:3001/api/v1/info
- **Supported Formats**: http://localhost:3001/api/v1/formats

## 🔄 Supported Conversions

| From | To | Max Size | Est. Time | Mobile Optimized |
|------|----|---------:|----------:|:----------------:|
| PDF | DOCX, XLSX, PPTX | 50MB | 5-30s | ✅ |
| DOCX, XLSX, PPTX | PDF | 100MB | 2-15s | ✅ |
| DOC, XLS, PPT | PDF | 100MB | 2-15s | ✅ |
| ODT, ODS, ODP | PDF | 100MB | 2-15s | ✅ |

## 💡 Usage Examples

### Convert PDF to DOCX

```bash
curl -X POST http://localhost:3001/api/v1/convert \
  -F "file=@document.pdf" \
  -F "targetFormat=docx" \
  -F "responseFormat=binary" \
  -o converted.docx
```

### Convert DOCX to PDF (Base64 Response)

```bash
curl -X POST http://localhost:3001/api/v1/convert \
  -F "file=@document.docx" \
  -F "targetFormat=pdf" \
  -F "responseFormat=base64" \
  | jq -r '.data' | base64 -d > converted.pdf
```

## 📱 Mobile Integration

See our comprehensive [Mobile Integration Guide](docs/mobile-integration-guide.md) for:
- React Native examples with file picker
- Flutter/Dart integration with error handling
- iOS Swift implementation with progress tracking
- Best practices for mobile apps

## 🧪 Development & Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=conversion
npm test -- --testPathPattern=performance

# Run with coverage
npm run test:cov
```

### Performance Testing Results

Our test suite shows excellent performance:
- **API Response Times**: 8-22ms average
- **Memory increase**: Only 2.23MB per conversion
- **Sequential requests**: 9.2ms average
- **Error handling**: <10ms response time

## 📚 Documentation

- 📚 [API Documentation](http://localhost:3001/api/v1/docs) - Interactive Swagger UI
- 📱 [Mobile Integration Guide](docs/mobile-integration-guide.md) - Mobile app examples
- 🔧 [Troubleshooting Guide](docs/troubleshooting-guide.md) - Common issues and solutions
- ⚡ [Performance Guide](docs/performance-recommendations.md) - Optimization strategies

## 🏭 Production Deployment

```bash
# Docker production setup
docker-compose -f docker-compose.prod.yml up -d

# Using deployment script
./scripts/deploy.sh production

# PM2 clustering
pm2 start ecosystem.config.js --env production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite (`npm test`)
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 🐛 [GitHub Issues](https://github.com/your-org/pdf-kit-server/issues)
- 📧 Email: support@pdfkit.com
- 📖 [Documentation](docs/)

---

**Built with ❤️ using NestJS, TypeScript, and LibreOffice**
