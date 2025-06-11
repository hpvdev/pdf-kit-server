# Troubleshooting Guide

## Common Issues and Solutions

### 1. Conversion Failures

#### Problem: "Conversion failed" error
**Symptoms:**
- HTTP 422 status code
- Error message: "Failed to convert file"

**Possible Causes & Solutions:**

1. **Corrupted or Invalid File**
   ```bash
   # Check file integrity
   file your-document.pdf
   # Should show: PDF document, version X.X
   ```
   - **Solution**: Try with a different file or re-save the original document

2. **Unsupported File Format**
   ```json
   {
     "error": {
       "code": "INVALID_REQUEST",
       "message": "Unsupported file type: text/plain"
     }
   }
   ```
   - **Solution**: Check supported formats at `/api/v1/formats`
   - Ensure file has correct extension and MIME type

3. **LibreOffice Service Down**
   ```bash
   # Check health endpoint
   curl http://localhost:3000/api/v1/health
   ```
   - **Solution**: Restart the service or check LibreOffice installation

#### Problem: "File too large" error
**Symptoms:**
- HTTP 413 status code
- Error about file size limits

**Solutions:**
1. **Compress the file before upload**
   ```bash
   # For PDFs, use ghostscript
   gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
      -dNOPAUSE -dQUIET -dBATCH -sOutputFile=compressed.pdf input.pdf
   ```

2. **Split large documents**
   - Use tools like `pdftk` to split PDFs
   - Convert sections separately and merge results

3. **Check current limits**
   ```bash
   curl http://localhost:3000/api/v1/formats
   # Shows maxFileSizeMB for each conversion type
   ```

### 2. Network and Connectivity Issues

#### Problem: Connection timeouts
**Symptoms:**
- Request hangs or times out
- No response from server

**Solutions:**

1. **Check server status**
   ```bash
   # Basic connectivity test
   curl -I http://localhost:3000/api/v1/health
   
   # Should return HTTP 200 or 503
   ```

2. **Increase timeout values**
   ```javascript
   // JavaScript example
   fetch(url, {
     method: 'POST',
     body: formData,
     signal: AbortSignal.timeout(60000) // 60 seconds
   })
   ```

3. **Check firewall and network settings**
   ```bash
   # Test port accessibility
   telnet localhost 3000
   
   # Check if service is listening
   netstat -tlnp | grep :3000
   ```

#### Problem: CORS errors in browser
**Symptoms:**
- "Access to fetch blocked by CORS policy"
- Browser console errors

**Solutions:**
1. **Configure CORS properly**
   - Check server CORS settings
   - Ensure your domain is allowed

2. **Use server-side proxy**
   ```javascript
   // Instead of direct browser calls, use your backend
   // Backend -> PDF Kit Server -> Response -> Frontend
   ```

### 3. Performance Issues

#### Problem: Slow conversion times
**Symptoms:**
- Conversions taking longer than expected
- Timeouts on large files

**Diagnostic Steps:**

1. **Check server load**
   ```bash
   # Monitor system resources
   top
   htop
   
   # Check memory usage
   free -h
   
   # Check disk space
   df -h
   ```

2. **Monitor conversion queue**
   ```bash
   curl http://localhost:3000/api/v1/health
   # Check "active_conversions" and "max_concurrent"
   ```

3. **Analyze processing times**
   ```bash
   # Check response headers for timing info
   curl -I -X POST http://localhost:3000/api/v1/convert \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test.pdf" \
     -F "targetFormat=docx"
   
   # Look for X-Processing-Time header
   ```

**Solutions:**

1. **Optimize file sizes**
   - Reduce image quality in documents
   - Remove unnecessary elements
   - Use appropriate compression

2. **Scale server resources**
   ```yaml
   # Docker Compose scaling
   services:
     pdf-kit-server:
       deploy:
         replicas: 3
         resources:
           limits:
             cpus: '2.0'
             memory: 4G
   ```

3. **Tune conversion settings**
   ```javascript
   // Use lower quality for faster processing
   {
     "targetFormat": "pdf",
     "quality": "standard", // instead of "high"
     "timeout": 30000
   }
   ```

### 4. Memory Issues

#### Problem: Out of memory errors
**Symptoms:**
- Server crashes or restarts
- "Cannot allocate memory" errors
- HTTP 503 responses

**Diagnostic Steps:**

1. **Monitor memory usage**
   ```bash
   # Real-time memory monitoring
   watch -n 1 'free -h && echo "---" && ps aux --sort=-%mem | head -10'
   ```

2. **Check application logs**
   ```bash
   # Docker logs
   docker logs pdf-kit-server
   
   # PM2 logs
   pm2 logs pdf-kit-server
   ```

**Solutions:**

1. **Increase memory limits**
   ```yaml
   # Docker Compose
   services:
     pdf-kit-server:
       deploy:
         resources:
           limits:
             memory: 4G
   ```

2. **Configure memory thresholds**
   ```bash
   # Environment variables
   export MEMORY_THRESHOLD_PERCENT=80
   export MAX_CONCURRENT_CONVERSIONS=2
   ```

3. **Implement memory cleanup**
   ```javascript
   // Force garbage collection (if enabled)
   if (global.gc) {
     global.gc();
   }
   ```

### 5. Docker and Deployment Issues

#### Problem: Container won't start
**Symptoms:**
- Docker container exits immediately
- "Container exited with code 1"

**Diagnostic Steps:**

1. **Check container logs**
   ```bash
   docker logs pdf-kit-server
   docker logs --follow pdf-kit-server
   ```

2. **Verify image build**
   ```bash
   docker build -t pdf-kit-server .
   docker run --rm -it pdf-kit-server sh
   ```

3. **Check dependencies**
   ```bash
   # Inside container
   which libreoffice
   libreoffice --version
   node --version
   npm --version
   ```

**Solutions:**

1. **Fix LibreOffice installation**
   ```dockerfile
   # Ensure proper LibreOffice installation
   RUN apk add --no-cache \
       libreoffice \
       openjdk11-jre \
       fontconfig \
       ttf-dejavu
   ```

2. **Check file permissions**
   ```bash
   # Ensure proper ownership
   docker run --rm -it pdf-kit-server ls -la /app
   ```

3. **Verify environment variables**
   ```bash
   docker run --rm -it pdf-kit-server env
   ```

#### Problem: Health check failures
**Symptoms:**
- Container marked as unhealthy
- Load balancer removing instances

**Solutions:**

1. **Adjust health check settings**
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
     CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 || res.statusCode === 503 ? 0 : 1) })"
   ```

2. **Check service startup time**
   ```bash
   # Monitor startup process
   docker logs --follow pdf-kit-server
   ```

### 6. API Integration Issues

#### Problem: Malformed requests
**Symptoms:**
- HTTP 400 Bad Request
- Validation errors

**Common Mistakes:**

1. **Incorrect Content-Type**
   ```bash
   # Wrong
   curl -H "Content-Type: application/json" ...
   
   # Correct for file upload
   curl -H "Content-Type: multipart/form-data" ...
   ```

2. **Missing required fields**
   ```javascript
   // Ensure all required fields are present
   const formData = new FormData();
   formData.append('file', file);
   formData.append('targetFormat', 'pdf'); // Required!
   ```

3. **Invalid enum values**
   ```javascript
   // Check valid values at /api/v1/formats
   {
     "targetFormat": "pdf", // Valid: pdf, docx, xlsx, pptx
     "quality": "standard", // Valid: standard, high
     "responseFormat": "binary" // Valid: binary, base64
   }
   ```

### 7. Debugging Tools and Commands

#### Server Diagnostics
```bash
# Complete health check
curl -s http://localhost:3000/api/v1/health | jq .

# Check supported formats
curl -s http://localhost:3000/api/v1/formats | jq .

# Server information
curl -s http://localhost:3000/api/v1/info | jq .

# Test file upload
curl -X POST http://localhost:3000/api/v1/convert \
  -F "file=@test.pdf" \
  -F "targetFormat=docx" \
  -F "responseFormat=base64" \
  -v
```

#### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 10 -c 2 -p test.pdf -T "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" \
   http://localhost:3000/api/v1/convert

# Memory usage monitoring
while true; do
  echo "$(date): $(docker stats --no-stream pdf-kit-server --format 'table {{.MemUsage}}\t{{.CPUPerc}}')"
  sleep 5
done
```

#### Log Analysis
```bash
# Filter error logs
docker logs pdf-kit-server 2>&1 | grep -i error

# Monitor real-time logs
docker logs --follow pdf-kit-server | grep -E "(ERROR|WARN|conversion)"

# Extract performance metrics
docker logs pdf-kit-server | grep "processing_time_ms" | tail -20
```

## Getting Help

### Before Contacting Support

1. **Gather system information**
   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version
   
   # Service status
   curl -s http://localhost:3000/api/v1/health | jq .
   
   # Recent logs
   docker logs --tail 50 pdf-kit-server
   ```

2. **Test with minimal example**
   ```bash
   # Create a simple test PDF
   echo "Test content" | ps2pdf - test.pdf
   
   # Try conversion
   curl -X POST http://localhost:3000/api/v1/convert \
     -F "file=@test.pdf" \
     -F "targetFormat=docx"
   ```

3. **Check documentation**
   - API Documentation: http://localhost:3000/api/v1/docs
   - Mobile Integration: [Mobile Guide](./mobile-integration-guide.md)
   - Performance: [Performance Guide](./performance-recommendations.md)

### Support Channels

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-org/pdf-kit-server/issues)
- **Documentation**: [Complete API documentation](http://localhost:3000/api/v1/docs)
- **Email Support**: support@pdfkit.com
- **Community**: [Discord/Slack community link]

### Issue Template

When reporting issues, please include:

```
**Environment:**
- OS: [e.g., Ubuntu 20.04, macOS 12.0, Windows 10]
- Docker version: [e.g., 20.10.8]
- PDF Kit Server version: [e.g., 2.0.0]

**Problem Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]

**Expected Behavior:**
[What you expected to happen]

**Actual Behavior:**
[What actually happened]

**Error Messages:**
[Any error messages or logs]

**Additional Context:**
[Any other relevant information]
```
