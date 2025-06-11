# Performance Recommendations

## Overview

This guide provides recommendations for optimizing PDF Kit Server performance in production environments, with special focus on mobile application requirements.

## Server Configuration

### 1. Hardware Requirements

#### Minimum Requirements
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 100 Mbps

#### Recommended for Production
- **CPU**: 4+ cores, 3.0+ GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB NVMe SSD
- **Network**: 1 Gbps

#### High-Load Production
- **CPU**: 8+ cores, 3.5+ GHz
- **RAM**: 16+ GB
- **Storage**: 100+ GB NVMe SSD
- **Network**: 10 Gbps
- **Load Balancer**: Multiple instances

### 2. Environment Variables Tuning

```bash
# Core performance settings
export NODE_ENV=production
export MAX_CONCURRENT_CONVERSIONS=3  # Adjust based on CPU cores
export MEMORY_THRESHOLD_PERCENT=85   # Stop accepting new jobs at 85% memory
export CONVERSION_TIMEOUT_SECONDS=30 # Timeout for individual conversions

# File size limits (in MB)
export MAX_FILE_SIZE_MB=100          # Office to PDF
export PDF_TO_OFFICE_MAX_SIZE_MB=50  # PDF to Office (more memory intensive)

# Memory management
export NODE_OPTIONS="--max-old-space-size=4096"  # 4GB heap limit
export UV_THREADPOOL_SIZE=8          # Increase thread pool for I/O operations

# Logging (reduce in production)
export LOG_LEVEL=info                # Use 'error' for minimal logging
export ENABLE_REQUEST_LOGGING=false  # Disable detailed request logging
```

### 3. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'pdf-kit-server',
    script: 'dist/main.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    
    // Performance settings
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048',
    
    // Environment
    env_production: {
      NODE_ENV: 'production',
      MAX_CONCURRENT_CONVERSIONS: 2,  // Per instance
      MEMORY_THRESHOLD_PERCENT: 80,
    },
    
    // Monitoring
    monitoring: true,
    pmx: true,
  }]
};
```

### 4. Docker Optimization

```dockerfile
# Multi-stage build for smaller images
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:20-alpine AS production
# Install only required packages
RUN apk add --no-cache libreoffice openjdk11-jre fontconfig ttf-dejavu

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Performance optimizations
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Resource limits
LABEL memory="2G"
LABEL cpu="1.0"

CMD ["node", "dist/main"]
```

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  pdf-kit-server:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '0.5'
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    
    # Performance settings
    environment:
      - NODE_ENV=production
      - MAX_CONCURRENT_CONVERSIONS=2
      - MEMORY_THRESHOLD_PERCENT=80
    
    # Health check optimization
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
```

## Application Performance

### 1. Conversion Optimization

#### File Size Management
```javascript
// Implement progressive file size limits
const getMaxFileSize = (sourceFormat, targetFormat) => {
  if (targetFormat === 'pdf') {
    // Office to PDF: more efficient
    return 100 * 1024 * 1024; // 100MB
  } else {
    // PDF to Office: memory intensive
    return 50 * 1024 * 1024;  // 50MB
  }
};

// Pre-conversion validation
const validateFileSize = (file, targetFormat) => {
  const maxSize = getMaxFileSize(file.mimetype, targetFormat);
  if (file.size > maxSize) {
    throw new Error(`File too large: ${file.size} > ${maxSize}`);
  }
};
```

#### Quality vs Speed Trade-offs
```javascript
// Conversion quality settings
const qualitySettings = {
  'fast': {
    dpi: 150,
    imageQuality: 75,
    compression: 'high'
  },
  'standard': {
    dpi: 300,
    imageQuality: 85,
    compression: 'medium'
  },
  'high': {
    dpi: 600,
    imageQuality: 95,
    compression: 'low'
  }
};

// Mobile-optimized defaults
const getMobileOptimizedSettings = (userAgent) => {
  if (isMobileDevice(userAgent)) {
    return qualitySettings.standard; // Balance quality and speed
  }
  return qualitySettings.high;
};
```

### 2. Memory Management

#### Garbage Collection Optimization
```javascript
// Force garbage collection after conversions
const performConversion = async (request) => {
  try {
    const result = await conversionEngine.convert(request);
    
    // Force GC if available
    if (global.gc && process.memoryUsage().heapUsed > MEMORY_THRESHOLD) {
      global.gc();
    }
    
    return result;
  } catch (error) {
    // Cleanup on error
    if (global.gc) global.gc();
    throw error;
  }
};
```

#### Memory Monitoring
```javascript
// Real-time memory monitoring
const monitorMemory = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (usagePercent > MEMORY_THRESHOLD_PERCENT) {
      logger.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
      
      // Reject new requests if memory is too high
      if (usagePercent > 90) {
        isAcceptingRequests = false;
      }
    } else {
      isAcceptingRequests = true;
    }
  }, 5000);
};
```

### 3. Concurrency Control

#### Queue Management
```javascript
class ConversionQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }
  
  async add(conversionTask) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task: conversionTask, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { task, resolve, reject } = this.queue.shift();
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process(); // Process next item
    }
  }
}
```

## Network Optimization

### 1. Response Compression

```javascript
// Enable compression middleware
app.use(compression({
  level: 6,           // Compression level (1-9)
  threshold: 1024,    // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress binary file responses
    if (res.getHeader('Content-Type')?.includes('application/octet-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### 2. Caching Strategy

```javascript
// Cache supported formats (rarely changes)
app.get('/formats', cache('1 hour'), (req, res) => {
  res.json(getSupportedFormats());
});

// Cache health check for 30 seconds
app.get('/health', cache('30 seconds'), (req, res) => {
  res.json(getHealthStatus());
});
```

### 3. Rate Limiting Optimization

```javascript
// Different limits for different endpoints
const conversionLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 5,                 // 5 conversions per minute
  message: 'Too many conversion requests'
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 100,               // 100 requests per minute
  message: 'Too many requests'
});

app.use('/convert', conversionLimiter);
app.use(generalLimiter);
```

## Mobile-Specific Optimizations

### 1. Response Size Optimization

```javascript
// Mobile-optimized response format
const formatMobileResponse = (data, userAgent) => {
  const isMobile = isMobileDevice(userAgent);
  
  return {
    success: true,
    data: isMobile ? compactData(data) : data,
    metadata: {
      processing_time_ms: data.processingTime,
      mobile_optimized: isMobile,
      // Reduce metadata for mobile
      ...(isMobile ? {} : { detailed_stats: data.stats })
    }
  };
};
```

### 2. Progressive File Processing

```javascript
// Stream processing for large files
const processFileStream = async (fileStream, targetFormat) => {
  const chunks = [];
  let processedSize = 0;
  
  for await (const chunk of fileStream) {
    chunks.push(chunk);
    processedSize += chunk.length;
    
    // Send progress updates for mobile clients
    if (processedSize % (1024 * 1024) === 0) { // Every 1MB
      sendProgressUpdate(processedSize);
    }
  }
  
  return Buffer.concat(chunks);
};
```

## Monitoring and Metrics

### 1. Performance Metrics

```javascript
// Key metrics to track
const metrics = {
  // Conversion metrics
  conversions_total: new Counter('conversions_total'),
  conversion_duration: new Histogram('conversion_duration_seconds'),
  conversion_errors: new Counter('conversion_errors_total'),
  
  // System metrics
  memory_usage: new Gauge('memory_usage_bytes'),
  active_conversions: new Gauge('active_conversions'),
  queue_size: new Gauge('queue_size'),
  
  // Mobile metrics
  mobile_requests: new Counter('mobile_requests_total'),
  response_size: new Histogram('response_size_bytes')
};
```

### 2. Health Check Optimization

```javascript
// Lightweight health check
app.get('/health', async (req, res) => {
  const start = Date.now();
  
  try {
    // Quick checks only
    const memoryOk = process.memoryUsage().heapUsed < MEMORY_THRESHOLD;
    const queueOk = conversionQueue.size < MAX_QUEUE_SIZE;
    
    const status = memoryOk && queueOk ? 'healthy' : 'degraded';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - start
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Load Balancing

### 1. Nginx Configuration

```nginx
upstream pdf_kit_backend {
    least_conn;
    server pdf-kit-1:3000 max_fails=3 fail_timeout=30s;
    server pdf-kit-2:3000 max_fails=3 fail_timeout=30s;
    server pdf-kit-3:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 80;
    
    # Conversion endpoint with special handling
    location /api/v1/convert {
        proxy_pass http://pdf_kit_backend;
        
        # Extended timeouts for conversions
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Disable buffering for large files
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Rate limiting
        limit_req zone=conversion burst=5 nodelay;
    }
    
    # Other endpoints
    location /api/v1/ {
        proxy_pass http://pdf_kit_backend;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### 2. Auto-scaling Configuration

```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pdf-kit-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pdf-kit-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Performance Testing

### 1. Load Testing Script

```bash
#!/bin/bash
# load-test.sh

# Test conversion endpoint
echo "Testing conversion performance..."

# Create test files
echo "Creating test files..."
for i in {1..5}; do
    echo "Test document $i content" | ps2pdf - test$i.pdf
done

# Run concurrent tests
echo "Running load test..."
for i in {1..10}; do
    (
        curl -X POST http://localhost:3000/api/v1/convert \
            -F "file=@test$((i % 5 + 1)).pdf" \
            -F "targetFormat=docx" \
            -w "Time: %{time_total}s, Size: %{size_download} bytes\n" \
            -o /dev/null -s
    ) &
done

wait
echo "Load test completed"
```

### 2. Performance Benchmarks

Target performance metrics:
- **Simple documents (< 1MB)**: 2-5 seconds
- **Medium documents (1-10MB)**: 5-15 seconds  
- **Large documents (10-50MB)**: 15-30 seconds
- **Concurrent requests**: 3-5 simultaneous conversions
- **Memory usage**: < 2GB per instance
- **CPU usage**: < 80% average
- **Success rate**: > 99%

## Troubleshooting Performance Issues

### 1. Common Performance Problems

1. **High memory usage**
   - Reduce `MAX_CONCURRENT_CONVERSIONS`
   - Implement stricter file size limits
   - Enable garbage collection monitoring

2. **Slow conversion times**
   - Check LibreOffice performance
   - Monitor disk I/O
   - Reduce conversion quality for speed

3. **Queue buildup**
   - Increase server instances
   - Implement request prioritization
   - Add queue monitoring

### 2. Performance Monitoring Commands

```bash
# Monitor real-time performance
watch -n 1 'curl -s http://localhost:3000/api/v1/health | jq .'

# Check memory usage
docker stats pdf-kit-server

# Monitor conversion times
tail -f logs/app.log | grep "processing_time_ms"

# Load testing
ab -n 100 -c 5 -p test.pdf -T "multipart/form-data" \
   http://localhost:3000/api/v1/convert
```

This performance guide should help you optimize PDF Kit Server for your specific use case and load requirements.
