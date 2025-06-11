# Mobile Integration Guide

## Overview

PDF Kit Server is optimized for mobile applications with features designed to handle the constraints and requirements of mobile environments.

## Quick Start

### Base URL
```
Production: https://api.pdfkit.com/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication
Currently, no authentication is required. Future versions will support API keys.

## Mobile-Optimized Features

### 1. Response Compression
All API responses are automatically compressed using gzip when the client supports it.

```javascript
// Enable compression in your HTTP client
fetch(url, {
  headers: {
    'Accept-Encoding': 'gzip, deflate'
  }
})
```

### 2. Mobile-Friendly Response Format
All responses follow a consistent structure optimized for mobile parsing:

```json
{
  "success": true,
  "data": { /* actual response data */ },
  "metadata": {
    "processing_time_ms": 150,
    "timestamp": "2024-07-24T10:00:00Z",
    "server_version": "2.0.0",
    "request_id": "req_1627123456789_abc123def",
    "mobile_optimized": true
  }
}
```

### 3. Error Handling with Recovery Suggestions
Errors include mobile-specific recovery suggestions:

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds limit",
    "recovery_suggestions": [
      "Reduce file size by compressing the document",
      "Try uploading a smaller file",
      "Check your internet connection"
    ]
  }
}
```

## Integration Examples

### React Native

```javascript
import { DocumentPicker } from 'react-native-document-picker';

class PDFConverter {
  constructor(baseUrl = 'https://api.pdfkit.com/api/v1') {
    this.baseUrl = baseUrl;
  }

  async convertFile(file, targetFormat, options = {}) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    });
    formData.append('targetFormat', targetFormat);
    formData.append('responseFormat', options.responseFormat || 'base64');
    formData.append('quality', options.quality || 'standard');

    try {
      const response = await fetch(`${this.baseUrl}/convert`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept-Encoding': 'gzip',
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result;
    } catch (error) {
      console.error('Conversion failed:', error);
      throw error;
    }
  }

  async getSupportedFormats() {
    const response = await fetch(`${this.baseUrl}/formats`);
    return response.json();
  }

  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage example
const converter = new PDFConverter();

// Convert PDF to DOCX
const convertPdfToWord = async () => {
  try {
    const file = await DocumentPicker.pick({
      type: [DocumentPicker.types.pdf],
    });

    const result = await converter.convertFile(file[0], 'docx', {
      responseFormat: 'base64',
      quality: 'high'
    });

    // Handle the base64 result
    console.log('Conversion successful:', result.filename);
    
    // Save or share the converted file
    // The base64 data is in result.data
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

### Flutter/Dart

```dart
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';

class PDFKitClient {
  final String baseUrl;
  
  PDFKitClient({this.baseUrl = 'https://api.pdfkit.com/api/v1'});

  Future<Map<String, dynamic>> convertFile({
    required File file,
    required String targetFormat,
    String responseFormat = 'base64',
    String quality = 'standard',
  }) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/convert'));
    
    request.fields['targetFormat'] = targetFormat;
    request.fields['responseFormat'] = responseFormat;
    request.fields['quality'] = quality;
    
    request.files.add(await http.MultipartFile.fromPath('file', file.path));
    request.headers['Accept-Encoding'] = 'gzip';

    try {
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        var errorData = json.decode(response.body);
        throw Exception(errorData['error']['message']);
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<Map<String, dynamic>> getSupportedFormats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/formats'),
      headers: {'Accept-Encoding': 'gzip'},
    );
    
    return json.decode(response.body);
  }
}

// Usage example
void main() async {
  final client = PDFKitClient();
  
  // Pick a PDF file
  FilePickerResult? result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['pdf'],
  );
  
  if (result != null) {
    File file = File(result.files.single.path!);
    
    try {
      var conversionResult = await client.convertFile(
        file: file,
        targetFormat: 'docx',
        responseFormat: 'base64',
        quality: 'high',
      );
      
      print('Conversion successful: ${conversionResult['filename']}');
      
      // Decode base64 and save file
      String base64Data = conversionResult['data'];
      List<int> bytes = base64Decode(base64Data);
      
      // Save to device storage
      // ...
      
    } catch (e) {
      print('Conversion failed: $e');
    }
  }
}
```

### iOS Swift

```swift
import Foundation

class PDFKitClient {
    private let baseURL: String
    
    init(baseURL: String = "https://api.pdfkit.com/api/v1") {
        self.baseURL = baseURL
    }
    
    func convertFile(
        fileURL: URL,
        targetFormat: String,
        responseFormat: String = "base64",
        quality: String = "standard",
        completion: @escaping (Result<[String: Any], Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/convert") else {
            completion(.failure(NSError(domain: "Invalid URL", code: 0, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("gzip", forHTTPHeaderField: "Accept-Encoding")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add form fields
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"targetFormat\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(targetFormat)\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"responseFormat\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(responseFormat)\r\n".data(using: .utf8)!)
        
        // Add file
        if let fileData = try? Data(contentsOf: fileURL) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileURL.lastPathComponent)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: application/pdf\r\n\r\n".data(using: .utf8)!)
            body.append(fileData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: 0, userInfo: nil)))
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    completion(.success(json))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// Usage example
let client = PDFKitClient()

client.convertFile(
    fileURL: pdfFileURL,
    targetFormat: "docx",
    responseFormat: "base64",
    quality: "high"
) { result in
    switch result {
    case .success(let response):
        if let success = response["success"] as? Bool, success {
            print("Conversion successful!")
            if let base64Data = response["data"] as? String {
                // Decode and save file
                if let data = Data(base64Encoded: base64Data) {
                    // Save to documents directory
                }
            }
        } else {
            print("Conversion failed: \(response)")
        }
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

## Best Practices for Mobile

### 1. File Size Management
- **PDF to Office**: Maximum 50MB
- **Office to PDF**: Maximum 100MB
- Compress files before upload when possible
- Show file size warnings to users

### 2. Network Optimization
- Always enable gzip compression
- Implement retry logic with exponential backoff
- Show upload progress to users
- Handle network interruptions gracefully

### 3. User Experience
- Show processing time estimates
- Implement proper loading states
- Cache supported formats locally
- Provide clear error messages with recovery suggestions

### 4. Error Handling
```javascript
const handleConversionError = (error) => {
  if (error.code === 'FILE_TOO_LARGE') {
    // Show file size reduction options
    showFileSizeOptions();
  } else if (error.code === 'NETWORK_ERROR') {
    // Offer retry option
    showRetryOption();
  } else if (error.code === 'SERVICE_UNAVAILABLE') {
    // Show service status and retry later
    showServiceStatus();
  } else {
    // Generic error handling
    showGenericError(error.recovery_suggestions);
  }
};
```

### 5. Performance Monitoring
Monitor these metrics in your mobile app:
- Conversion success rate
- Average processing time
- Network error rate
- File size distribution
- User retry patterns

## API Endpoints Summary

| Endpoint | Method | Purpose | Mobile Optimized |
|----------|--------|---------|------------------|
| `/convert` | POST | Convert files | ✅ |
| `/formats` | GET | Get supported formats | ✅ |
| `/health` | GET | Service health check | ✅ |
| `/info` | GET | Server information | ✅ |

## Rate Limits

- **Conversion**: 2 requests per second per IP
- **Other endpoints**: 10 requests per second per IP
- **Burst**: Up to 5 concurrent conversion requests

## Support

For mobile integration support:
- GitHub Issues: [Repository Issues](https://github.com/your-org/pdf-kit-server/issues)
- Documentation: [API Docs](http://localhost:3001/api/v1/docs)
- Email: support@pdfkit.com
